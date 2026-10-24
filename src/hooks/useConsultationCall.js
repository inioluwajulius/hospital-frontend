import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * One-to-one WebRTC call for a telemedicine consultation, signalled over the
 * app's Socket.IO connection ('consult:signal').
 *
 * Built for low bandwidth: audio-first, optional 320x240 @ 15fps video, and
 * bitrate caps (audio ~32 kbps, video ~150 kbps) so a call stays usable on 3G.
 *
 * States: idle -> calling (we offered) | incoming (they offered) -> connecting -> in-call
 */

const AUDIO_BITRATE = 32000;
const VIDEO_BITRATE = 150000;

// Rough data use per minute, shown to users before they start a call
export const DATA_PER_MINUTE = {
  audio: ((AUDIO_BITRATE * 60) / 8 / 1024 / 1024).toFixed(2), // MB
  video: (((AUDIO_BITRATE + VIDEO_BITRATE) * 60) / 8 / 1024 / 1024).toFixed(1),
};

const mediaConstraints = (mode) => ({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  video: mode === 'video' ? { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 15 } } : false,
});

const describeMediaError = (err) => {
  if (err?.name === 'NotAllowedError') return 'Microphone/camera permission was denied. Allow access in your browser to start the call.';
  if (err?.name === 'NotFoundError') return 'No microphone or camera was found on this device.';
  if (err?.name === 'NotReadableError') return 'Your microphone or camera is being used by another app.';
  if (!navigator.mediaDevices?.getUserMedia) return 'This browser does not support calls. Try Chrome, Edge, Firefox or Safari.';
  return 'Could not access your microphone or camera.';
};

export const useConsultationCall = ({ socket, appointmentId, participant, iceServers, onEvent }) => {
  const [callState, setCallState] = useState('idle');
  const [callMode, setCallMode] = useState('audio');
  const [incomingMode, setIncomingMode] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState('');
  const [connectedAt, setConnectedAt] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const stateRef = useRef('idle');
  const localVideoRef = useRef(null);
  const remoteMediaRef = useRef(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; });

  const setState = (s) => { stateRef.current = s; setCallState(s); };

  const signal = useCallback((type, payload) => {
    socket?.emit('consult:signal', { appointmentId, type, payload });
  }, [socket, appointmentId]);

  const cleanup = useCallback(() => {
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
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteMediaRef.current) remoteMediaRef.current.srcObject = null;
    setMuted(false);
    setCameraOff(false);
    setIncomingMode(null);
    setConnectedAt(null);
    setState('idle');
  }, []);

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

  const createPeer = useCallback((stream) => {
    const pc = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.onicecandidate = (e) => { if (e.candidate) signal('candidate', e.candidate.toJSON()); };
    pc.ontrack = (e) => {
      remoteStreamRef.current = e.streams[0];
      if (remoteMediaRef.current) remoteMediaRef.current.srcObject = e.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setState('in-call');
        setConnectedAt((t) => t || Date.now());
        limitBitrate(pc);
      } else if (pc.connectionState === 'failed') {
        setError('The call connection failed. This can happen on very restrictive networks; you can keep using chat.');
        cleanup();
      }
    };
    pcRef.current = pc;
    return pc;
  }, [iceServers, signal, cleanup]);

  const openMedia = async (mode) => {
    const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints(mode));
    localStreamRef.current = stream;
    if (localVideoRef.current && mode === 'video') localVideoRef.current.srcObject = stream;
    return stream;
  };

  const flushCandidates = async () => {
    const pc = pcRef.current;
    for (const c of pendingCandidatesRef.current) {
      try { await pc.addIceCandidate(c); } catch { /* stale candidate */ }
    }
    pendingCandidatesRef.current = [];
  };

  /** Start a call (we send the offer) */
  const startCall = useCallback(async (mode = 'audio') => {
    if (stateRef.current !== 'idle') return;
    setError('');
    setCallMode(mode);
    setState('calling');
    try {
      const stream = await openMedia(mode);
      const pc = createPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal('offer', { sdp: pc.localDescription.toJSON(), mode });
    } catch (err) {
      setError(describeMediaError(err));
      cleanup();
    }
  }, [createPeer, signal, cleanup]);

  /** Accept an incoming call, optionally downgrading video to audio-only */
  const answerCall = useCallback(async (mode) => {
    const offer = pendingOfferRef.current;
    if (!offer) return;
    setError('');
    const useMode = mode || offer.mode;
    setCallMode(useMode);
    setState('connecting');
    try {
      const stream = await openMedia(useMode);
      const pc = createPeer(stream);
      await pc.setRemoteDescription(offer.sdp);
      await flushCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal('answer', { sdp: pc.localDescription.toJSON() });
      pendingOfferRef.current = null;
    } catch (err) {
      setError(describeMediaError(err));
      signal('decline');
      cleanup();
    }
  }, [createPeer, signal, cleanup]);

  const declineCall = useCallback(() => {
    signal('decline');
    cleanup();
  }, [signal, cleanup]);

  const hangUp = useCallback(() => {
    signal('hangup');
    cleanup();
  }, [signal, cleanup]);

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
  };

  // Incoming signalling
  useEffect(() => {
    if (!socket) return undefined;
    const handleSignal = async ({ type, payload }) => {
      try {
        if (type === 'offer') {
          if (stateRef.current === 'idle') {
            pendingOfferRef.current = payload;
            setIncomingMode(payload.mode || 'audio');
            setState('incoming');
            onEventRef.current?.('incoming', payload.mode);
          } else if (stateRef.current === 'calling' && participant === 'patient') {
            // Both pressed call at once: the patient yields and answers the doctor's call
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            pcRef.current?.close();
            pcRef.current = null;
            pendingOfferRef.current = payload;
            setState('idle');
            await answerCall(payload.mode);
          }
        } else if (type === 'answer' && pcRef.current && stateRef.current === 'calling') {
          setState('connecting');
          await pcRef.current.setRemoteDescription(payload.sdp);
          await flushCandidates();
        } else if (type === 'candidate') {
          if (pcRef.current?.remoteDescription) {
            await pcRef.current.addIceCandidate(payload);
          } else {
            pendingCandidatesRef.current.push(payload);
          }
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
  }, [socket, participant, answerCall, cleanup]);

  // Leaving the page ends any call
  useEffect(() => () => {
    if (stateRef.current !== 'idle') socket?.emit('consult:signal', { appointmentId, type: 'hangup' });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
  }, [socket, appointmentId]);

  /** The other participant left the room: end the call locally */
  const peerLeft = useCallback(() => {
    if (stateRef.current !== 'idle') {
      onEventRef.current?.('ended');
      cleanup();
    }
  }, [cleanup]);

  return {
    callState, callMode, incomingMode, muted, cameraOff, error, connectedAt,
    localVideoRef, remoteMediaRef,
    startCall, answerCall, declineCall, hangUp, toggleMute, toggleCamera, peerLeft, clearError: () => setError(''),
  };
};

export default useConsultationCall;
