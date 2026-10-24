import { useCallback, useEffect, useRef, useState } from 'react';
import { setActiveCall } from '../services/callStore';

/**
 * One-to-one WebRTC call for a telemedicine consultation.
 *
 * Ringing goes through the server to the other person wherever they are in the app
 * ('call:ring' -> their incoming-call popup, see services/callStore.js). Once they answer
 * and open this room, the media is connected over 'consult:signal':
 *
 *   caller: idle -> calling (ringing) -> connecting (answered; sends the offer on 'ready') -> in-call
 *   callee: popup Accept -> joinAcceptedCall: connecting (sends 'ready', answers the offer) -> in-call
 *
 * Built for low bandwidth: audio-first, optional 320x240 @ 15fps video, and
 * bitrate caps (audio ~32 kbps, video ~150 kbps) so a call stays usable on 3G.
 *
 * Built for unreliable networks:
 * - signalling survives Socket.IO reconnects (messages are buffered and the room re-joined),
 *   and a brief socket drop never tears down media that is still flowing peer to peer;
 * - a dropped media path is repaired with an ICE restart before giving up;
 * - ringing and connecting time out with an explanation instead of spinning forever.
 */

const AUDIO_BITRATE = 32000;
const VIDEO_BITRATE = 150000;
const RING_TIMEOUT_MS = 50000; // fallback only: the server stops ringing after 45 s
const ANSWERED_TIMEOUT_MS = 60000; // answered, but they never got into the room
const CONNECT_TIMEOUT_MS = 30000; // in the room, but no media path could be found
const RECOVERY_TIMEOUT_MS = 20000; // media dropped mid-call and could not be restored
const PEER_LEFT_GRACE_MS = 10000; // the other side's socket dropped: wait for media to tell

// Rough data use per minute, shown to users before they start a call
export const DATA_PER_MINUTE = {
  audio: ((AUDIO_BITRATE * 60) / 8 / 1024 / 1024).toFixed(2), // MB
  video: (((AUDIO_BITRATE + VIDEO_BITRATE) * 60) / 8 / 1024 / 1024).toFixed(1),
};

const AUDIO_CONSTRAINTS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
const VIDEO_CONSTRAINTS = { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 15 } };

const describeMediaError = (err) => {
  if (err?.name === 'NotAllowedError') return 'Microphone/camera permission was denied. Allow access in your browser (padlock icon in the address bar) and try again.';
  if (err?.name === 'NotFoundError') return 'No microphone was found on this device.';
  if (err?.name === 'NotReadableError') return 'Your microphone is being used by another app or browser tab. Close it and try again.';
  if (!navigator.mediaDevices?.getUserMedia) return 'This browser cannot make calls here. Use Chrome, Edge, Firefox or Safari, and open the site over https.';
  return 'Could not access your microphone or camera.';
};

// Why a call could not ring, or why it ended before connecting
const callProblem = (reason, who) => ({
  offline: `${who} is not online right now, so the call could not ring. They will see a missed-call notification; you can also send a message.`,
  busy: `${who} is on another call. Try again in a few minutes or send a message.`,
  'in-progress': `${who} is calling you right now. Answer the incoming call instead.`,
  'not-started': 'The consultation has not been started yet.',
  missed: `No answer. ${who} may have stepped away; try again or send a message.`,
  unavailable: `${who} answered but could not turn on their microphone or camera.`,
}[reason] || 'Could not place the call. Check your connection and try again.');

// Named timers (ring, connect, recover, ...) kept in a ref-held object
const clearNamedTimer = (timers, name) => { clearTimeout(timers[name]); delete timers[name]; };
const setNamedTimer = (timers, name, ms, fn) => { clearNamedTimer(timers, name); timers[name] = setTimeout(fn, ms); };

const NO_CONNECTION_MESSAGE = 'Could not connect the call. Your network may be blocking direct calls between devices. Try switching between Wi-Fi and mobile data, or keep using the chat.';

export const useConsultationCall = ({ socket, appointmentId, otherName = 'The other person', iceServers, relayAvailable = true, onEvent }) => {
  const [callState, setCallState] = useState('idle');
  const [callMode, setCallMode] = useState('audio');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connectedAt, setConnectedAt] = useState(null);
  const [remoteVideo, setRemoteVideo] = useState(false); // the other side is sending live video
  const [reconnecting, setReconnecting] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const stateRef = useRef('idle');
  const isOffererRef = useRef(false);
  const callIdRef = useRef(null);
  const offerModeRef = useRef('audio'); // the call's type (the answerer may send audio only)
  const timersRef = useRef({});
  const remoteCameraOffRef = useRef(false);
  const localVideoRef = useRef(null);
  const remoteMediaRef = useRef(null);
  const onEventRef = useRef(onEvent);
  const socketRef = useRef(socket);
  const appointmentRef = useRef(appointmentId);
  const otherNameRef = useRef(otherName);
  useEffect(() => { onEventRef.current = onEvent; otherNameRef.current = otherName; });
  useEffect(() => { socketRef.current = socket; appointmentRef.current = appointmentId; }, [socket, appointmentId]);

  const setState = (s) => {
    stateRef.current = s;
    setCallState(s);
    setActiveCall(s === 'idle' ? null : appointmentRef.current); // a second incoming call gets "busy"
  };

  const clearTimer = (name) => clearNamedTimer(timersRef.current, name);
  const setTimer = (name, ms, fn) => setNamedTimer(timersRef.current, name, ms, fn);

  // Socket.IO buffers emits while disconnected and sends them on reconnect
  const signal = useCallback((type, payload) => {
    socketRef.current?.emit('consult:signal', { appointmentId: appointmentRef.current, type, payload });
  }, []);

  // Tell the server the call is over (stops the other person's ringing and frees them up)
  const endOnServer = useCallback(() => {
    if (callIdRef.current) socketRef.current?.emit('call:end', { callId: callIdRef.current });
  }, []);

  const cleanup = useCallback(() => {
    Object.keys(timersRef.current).forEach(clearTimer);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
    }
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    isOffererRef.current = false;
    callIdRef.current = null;
    remoteCameraOffRef.current = false;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteMediaRef.current) remoteMediaRef.current.srcObject = null;
    setMuted(false);
    setCameraOff(false);
    setConnectedAt(null);
    setRemoteVideo(false);
    setReconnecting(false);
    setPlaybackBlocked(false);
    setState('idle');
  }, []);

  const endWithError = useCallback((message) => {
    setError(message);
    endOnServer();
    signal('hangup');
    cleanup();
  }, [signal, endOnServer, cleanup]);

  const limitBitrate = async (pc) => {
    for (const sender of pc.getSenders()) {
      if (!sender.track) continue;
      try {
        const params = sender.getParameters();
        if (!params.encodings || !params.encodings.length) params.encodings = [{}];
        params.encodings[0].maxBitrate = sender.track.kind === 'video' ? VIDEO_BITRATE : AUDIO_BITRATE;
        await sender.setParameters(params);
      } catch {
        // Not supported everywhere; the low capture resolution still keeps usage down
      }
    }
  };

  // Browsers may refuse to start audio/video without a user gesture (iOS Safari especially)
  const playRemote = useCallback(() => {
    const el = remoteMediaRef.current;
    if (!el || !el.srcObject) return;
    const attempt = el.play();
    if (attempt?.catch) attempt.then(() => setPlaybackBlocked(false)).catch(() => setPlaybackBlocked(true));
  }, []);

  const updateRemoteVideo = useCallback(() => {
    const track = remoteStreamRef.current?.getVideoTracks()[0];
    setRemoteVideo(Boolean(track && track.readyState === 'live' && !track.muted && !remoteCameraOffRef.current));
  }, []);

  /** ICE restart, driven by the side that made the original offer (avoids both restarting at once) */
  const restartIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !isOffererRef.current || pc.signalingState !== 'stable') return;
    try {
      pc.restartIce?.();
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      signal('offer', { sdp: pc.localDescription.toJSON(), renegotiate: true });
    } catch (err) {
      console.error('ICE restart failed:', err);
    }
  }, [signal]);

  const createPeer = useCallback((stream, mode, asOfferer) => {
    const pc = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    // The offer must include video on video calls even when our own camera is off or
    // unavailable, so the other side can still send theirs (the answerer gets these
    // receivers from the offer automatically)
    if (asOfferer && mode === 'video' && !stream.getVideoTracks().length) pc.addTransceiver('video', { direction: 'recvonly' });

    pc.onicecandidate = (e) => { if (e.candidate) signal('candidate', e.candidate.toJSON()); };
    pc.ontrack = (e) => {
      const remote = e.streams[0] || remoteStreamRef.current || new MediaStream();
      if (!e.streams[0]) remote.addTrack(e.track);
      remoteStreamRef.current = remote;
      if (remoteMediaRef.current && remoteMediaRef.current.srcObject !== remote) remoteMediaRef.current.srcObject = remote;
      e.track.onmute = updateRemoteVideo;
      e.track.onunmute = updateRemoteVideo;
      e.track.onended = updateRemoteVideo;
      updateRemoteVideo();
      playRemote();
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        clearTimer('connect');
        clearTimer('recover');
        setReconnecting(false);
        setState('in-call');
        setConnectedAt((t) => t || Date.now());
        limitBitrate(pc);
        playRemote();
      } else if (state === 'disconnected' || state === 'failed') {
        if (stateRef.current !== 'in-call') return; // the connect timeout handles calls that never connected
        // Media path dropped (network switch, weak signal): try to repair it
        setReconnecting(true);
        if (state === 'failed') restartIce();
        else setTimer('restart', 3000, () => { if (pc.connectionState !== 'connected') restartIce(); });
        if (!timersRef.current.recover) {
          setTimer('recover', RECOVERY_TIMEOUT_MS, () => {
            if (pc.connectionState !== 'connected') endWithError('The call dropped and could not reconnect. Check your connection and call again, or use the chat.');
          });
        }
      }
    };
    pcRef.current = pc;
    return pc;
  }, [iceServers, signal, updateRemoteVideo, playRemote, restartIce, endWithError]);

  /** Microphone (+ camera for video). If the camera is missing or busy, continue with audio. */
  const openMedia = async (mode) => {
    let stream;
    if (mode === 'video') {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS, video: VIDEO_CONSTRAINTS });
      } catch (err) {
        if (err?.name === 'NotAllowedError') throw err;
        stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS, video: false });
        setNotice('Your camera is unavailable, so you joined with audio only. You can still see the other person.');
      }
    } else {
      stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS, video: false });
    }
    localStreamRef.current = stream;
    if (localVideoRef.current && stream.getVideoTracks().length) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play?.().catch(() => {});
    }
    setCameraOff(mode === 'video' && !stream.getVideoTracks().length);
    return stream;
  };

  const flushCandidates = async () => {
    const pc = pcRef.current;
    for (const c of pendingCandidatesRef.current) {
      try { await pc.addIceCandidate(c); } catch { /* stale candidate */ }
    }
    pendingCandidatesRef.current = [];
  };

  const startConnectTimer = () => setTimer('connect', CONNECT_TIMEOUT_MS, () => {
    if (stateRef.current === 'connecting') {
      endWithError(relayAvailable ? NO_CONNECTION_MESSAGE : `${NO_CONNECTION_MESSAGE} (The clinic has not set up a call relay server yet.)`);
    }
  });

  /** Caller: they answered (popup) and are on their way into the room */
  const onAnswered = useCallback(() => {
    if (stateRef.current !== 'calling') return;
    clearTimer('ring');
    setState('connecting');
    setTimer('answered', ANSWERED_TIMEOUT_MS, () => {
      if (stateRef.current === 'connecting' && !pcRef.current) endWithError(`${otherNameRef.current} answered but could not join the call. Try calling again.`);
    });
  }, [endWithError]);

  /** Caller: they are in the room with their microphone/camera on, so send the offer */
  const sendOffer = useCallback(async () => {
    if (!isOffererRef.current || pcRef.current || !localStreamRef.current) return;
    onAnswered();
    clearTimer('answered');
    try {
      const pc = createPeer(localStreamRef.current, offerModeRef.current, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal('offer', { sdp: pc.localDescription.toJSON(), mode: offerModeRef.current, callId: callIdRef.current });
      startConnectTimer();
    } catch (err) {
      console.error('Could not start the call:', err);
      endWithError('Could not start the call. Try again.');
    }
    // startConnectTimer only touches refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPeer, signal, onAnswered, endWithError]);

  /** Start a call: ring the other person wherever they are in the app */
  const startCall = useCallback(async (mode = 'audio') => {
    if (stateRef.current !== 'idle') return;
    setError('');
    setNotice('');
    setCallMode(mode);
    offerModeRef.current = mode;
    setState('calling');
    isOffererRef.current = true;
    try {
      await openMedia(mode); // early, so the permission prompt doesn't hold up the call later
    } catch (err) {
      setError(describeMediaError(err));
      cleanup();
      return;
    }
    if (stateRef.current !== 'calling') return; // hung up while the permission prompt was open
    setTimer('ring', RING_TIMEOUT_MS, () => {
      if (stateRef.current === 'calling') endWithError(callProblem('missed', otherNameRef.current));
    });
    socketRef.current?.emit('call:ring', { appointmentId: appointmentRef.current, mode }, (ack) => {
      if (!ack?.ok) {
        if (stateRef.current === 'calling') {
          setError(callProblem(ack?.reason, otherNameRef.current));
          cleanup();
        }
        return;
      }
      if (stateRef.current !== 'calling') {
        socketRef.current?.emit('call:end', { callId: ack.callId }); // hung up before the server replied
        return;
      }
      callIdRef.current = ack.callId;
    });
  }, [cleanup, endWithError]);

  /** Callee: the call was answered in the popup; open the microphone/camera and connect */
  const joinAcceptedCall = useCallback(async (accepted) => {
    if (!accepted || stateRef.current !== 'idle') return;
    setError('');
    setNotice('');
    const useMode = accepted.answerMode || accepted.mode;
    offerModeRef.current = accepted.mode;
    setCallMode(accepted.mode === 'video' ? 'video' : useMode); // still show their video if we only send audio
    callIdRef.current = accepted.callId;
    isOffererRef.current = false;
    setState('connecting');
    try {
      await openMedia(useMode);
    } catch (err) {
      setError(describeMediaError(err));
      socketRef.current?.emit('call:decline', { callId: accepted.callId, reason: 'media' });
      cleanup();
      return;
    }
    if (stateRef.current !== 'connecting' || callIdRef.current !== accepted.callId) return; // ended meanwhile
    signal('ready', { callId: accepted.callId });
    startConnectTimer();
    // openMedia/startConnectTimer only touch refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup, signal]);

  const hangUp = useCallback(() => {
    endOnServer();
    signal('hangup');
    cleanup();
  }, [signal, endOnServer, cleanup]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
    signal('media', { cameraOff: !track.enabled });
  };

  // Ringing results from the server (sent to this user on every tab, so match the call id)
  useEffect(() => {
    if (!socket) return undefined;
    const onAccepted = ({ callId } = {}) => {
      if (callId && callId === callIdRef.current && isOffererRef.current) onAnswered();
    };
    const onClosed = ({ callId, reason } = {}) => {
      if (!callId || callId !== callIdRef.current || stateRef.current === 'idle') return;
      if (reason === 'declined') onEventRef.current?.('declined');
      else if (reason === 'cancelled' || reason === 'ended') onEventRef.current?.('ended');
      else setError(callProblem(reason, otherNameRef.current));
      cleanup();
    };
    socket.on('call:accepted', onAccepted);
    socket.on('call:closed', onClosed);
    return () => {
      socket.off('call:accepted', onAccepted);
      socket.off('call:closed', onClosed);
    };
  }, [socket, onAnswered, cleanup]);

  // Media signalling inside the consultation room
  useEffect(() => {
    if (!socket) return undefined;
    const handleSignal = async ({ type, payload }) => {
      try {
        const pc = pcRef.current;
        if (type === 'ready') {
          if (payload?.callId && payload.callId === callIdRef.current) await sendOffer();
        } else if (type === 'offer') {
          if (payload?.renegotiate && pc) {
            // ICE restart from the other side: answer on the existing connection
            await pc.setRemoteDescription(payload.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            signal('answer', { sdp: pc.localDescription.toJSON() });
          } else if (!pc && !isOffererRef.current && stateRef.current === 'connecting' && payload?.callId === callIdRef.current && localStreamRef.current) {
            // The call we accepted
            const peer = createPeer(localStreamRef.current, offerModeRef.current, false);
            await peer.setRemoteDescription(payload.sdp);
            await flushCandidates();
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            signal('answer', { sdp: peer.localDescription.toJSON() });
            if (offerModeRef.current === 'video' && !localStreamRef.current.getVideoTracks().length) signal('media', { cameraOff: true });
          }
        } else if (type === 'answer' && pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(payload.sdp);
          await flushCandidates();
        } else if (type === 'candidate') {
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(payload);
          } else {
            pendingCandidatesRef.current.push(payload);
          }
        } else if (type === 'media') {
          remoteCameraOffRef.current = Boolean(payload?.cameraOff);
          updateRemoteVideo();
        } else if (type === 'hangup') {
          if (stateRef.current !== 'idle') onEventRef.current?.('ended');
          cleanup();
        } else if (type === 'decline') {
          if (stateRef.current !== 'idle') onEventRef.current?.('declined');
          cleanup();
        }
      } catch (err) {
        console.error('Call signalling error:', err);
      }
    };
    socket.on('consult:signal', handleSignal);
    return () => socket.off('consult:signal', handleSignal);
  }, [socket, sendOffer, createPeer, cleanup, signal, updateRemoteVideo]);

  // Leaving the page (or closing the tab) ends the call for both sides
  useEffect(() => {
    const endOnExit = () => {
      if (stateRef.current === 'idle') return;
      if (callIdRef.current) socketRef.current?.emit('call:end', { callId: callIdRef.current });
      socketRef.current?.emit('consult:signal', { appointmentId: appointmentRef.current, type: 'hangup' });
    };
    window.addEventListener('pagehide', endOnExit);
    const timers = timersRef.current;
    return () => {
      window.removeEventListener('pagehide', endOnExit);
      endOnExit();
      Object.values(timers).forEach(clearTimeout);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      setActiveCall(null);
    };
  }, []);

  /**
   * The other participant's socket left the room. That also happens on a brief network
   * blip while media keeps flowing, so only end the call if media stops too. While ringing
   * they don't need to be in the room at all.
   */
  const peerLeft = useCallback(() => {
    if (stateRef.current === 'idle' || stateRef.current === 'calling' || !pcRef.current) return;
    setTimer('peer', PEER_LEFT_GRACE_MS, () => {
      if (stateRef.current !== 'idle' && pcRef.current?.connectionState !== 'connected') {
        onEventRef.current?.('ended');
        endOnServer();
        cleanup();
      }
    });
  }, [cleanup, endOnServer]);

  return {
    callState, callMode, muted, cameraOff, error, notice, connectedAt, remoteVideo, reconnecting, playbackBlocked,
    localVideoRef, remoteMediaRef,
    startCall, joinAcceptedCall, hangUp, toggleMute, toggleCamera, peerLeft, resumePlayback: playRemote,
    clearError: () => setError(''),
  };
};

export default useConsultationCall;
