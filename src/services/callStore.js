import { useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import { startRingtone, stopRingtone } from './ringtone';

/**
 * App-wide incoming calls. Handlers are attached once to the shared socket (see
 * services/socket.js), not to a page, so a call rings on whatever page is open and
 * navigation or re-renders never add or lose listeners.
 *
 *   incoming  the call that is ringing now (shown by <IncomingCallPopup />)
 *   accepted  answered here; the consultation room picks it up and connects the media
 *   sound     ringtone status: 'playing' | 'blocked' | 'unsupported' | 'stopped'
 */

let state = { incoming: null, accepted: null, sound: 'stopped' };
const listeners = new Set();
const setState = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const useCallStore = () => useSyncExternalStore(subscribe, () => state);

let socket = null;
let busyWith = null; // appointment id of the call in progress in this tab (set by useConsultationCall)
let expiryTimer = null;
let browserNotification = null;

export const setActiveCall = (appointmentId) => { busyWith = appointmentId || null; };

export const callerLabel = (caller) => {
  if (!caller) return 'Someone';
  return caller.role === 'doctor' ? `Dr. ${String(caller.name).replace(/^Dr\.?\s*/i, '')}` : caller.name;
};

// Supplementary alert when the tab is in the background (only if the person allowed it)
const showBrowserNotification = (call) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !document.hidden) return;
  try {
    browserNotification = new Notification(`Incoming ${call.mode === 'video' ? 'video' : 'voice'} call`, {
      body: `${callerLabel(call.caller)} is calling you. Open the app to answer.`,
      tag: `call-${call.callId}`,
      requireInteraction: true,
    });
    browserNotification.onclick = () => { window.focus(); browserNotification?.close(); };
  } catch {
    browserNotification = null; // e.g. mobile browsers that only allow notifications from a service worker
  }
};

const stopAlerts = () => {
  stopRingtone();
  clearTimeout(expiryTimer);
  browserNotification?.close();
  browserNotification = null;
};

const clearIncoming = () => {
  stopAlerts();
  setState({ incoming: null });
};

const onIncoming = (call) => {
  if (!call?.callId || state.incoming?.callId === call.callId || state.accepted?.callId === call.callId) return; // duplicate
  if (busyWith || state.incoming) {
    socket?.emit('call:decline', { callId: call.callId, reason: 'busy' });
    return;
  }
  setState({ incoming: call });
  startRingtone((sound) => setState({ sound }));
  showBrowserNotification(call);
  // In case the 'closed' message never arrives (connection lost), stop ringing on time
  expiryTimer = setTimeout(() => { if (state.incoming?.callId === call.callId) clearIncoming(); }, Math.max(5000, call.expiresAt - Date.now() + 3000));
};

const onClosed = ({ callId, reason } = {}) => {
  if (state.incoming?.callId === callId) {
    const caller = callerLabel(state.incoming.caller);
    clearIncoming();
    if (reason === 'missed' || reason === 'cancelled') toast(`Missed call from ${caller}`, { icon: '📞' });
  }
  if (state.accepted?.callId === callId) setState({ accepted: null });
};

// Answered on another tab or device
const onAccepted = ({ callId } = {}) => {
  if (state.incoming?.callId === callId) clearIncoming();
};

export const attachCallHandlers = (s) => {
  socket = s;
  s.on('call:incoming', onIncoming);
  s.on('call:closed', onClosed);
  s.on('call:accepted', onAccepted);
};

/** Signed out: forget everything and stop ringing */
export const resetCalls = () => {
  stopAlerts();
  socket = null;
  busyWith = null;
  setState({ incoming: null, accepted: null, sound: 'stopped' });
};

/** Answer the ringing call. answerMode 'audio' answers a video call without the camera. */
export const acceptIncoming = (answerMode) => {
  const call = state.incoming;
  if (!call) return null;
  stopAlerts();
  const accepted = { ...call, answerMode: answerMode || call.mode };
  setState({ incoming: null, accepted });
  socket?.emit('call:accept', { callId: call.callId }, (ack) => {
    if (!ack?.ok && state.accepted?.callId === call.callId) {
      setState({ accepted: null });
      toast.error('This call has ended or was answered somewhere else.');
    }
  });
  return accepted;
};

export const declineIncoming = () => {
  const call = state.incoming;
  if (!call) return;
  socket?.emit('call:decline', { callId: call.callId });
  clearIncoming();
};

/** Used by the consultation room: take the answered call for this appointment, once */
export const takeAcceptedCall = (appointmentId) => {
  const call = state.accepted;
  if (!call || call.appointmentId !== String(appointmentId)) return null;
  setState({ accepted: null });
  return call;
};

// Browser notification permission: asked once, from a button, never automatically
const ASKED_KEY = 'hms.callAlertsAsked';
export const canAskForCallAlerts = () => typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem(ASKED_KEY);
export const askForCallAlerts = async () => {
  localStorage.setItem(ASKED_KEY, '1');
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
};
export const dismissCallAlerts = () => localStorage.setItem(ASKED_KEY, '1');
