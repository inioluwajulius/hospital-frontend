import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, PhoneIncoming, Video, Volume2 } from 'lucide-react';
import { useCallStore, acceptIncoming, declineIncoming, callerLabel } from '../services/callStore';
import { enableRingtone } from '../services/ringtone';

/**
 * Incoming-call popup, mounted once for the whole app (App.jsx), above every page.
 * Accepting opens the consultation room, which connects the call.
 */
const IncomingCallPopup = () => {
  const { incoming, sound } = useCallStore();
  const navigate = useNavigate();
  const location = useLocation();
  const acceptRef = useRef(null);

  useEffect(() => {
    if (incoming) acceptRef.current?.focus();
  }, [incoming]);

  if (!incoming) return null;

  const isVideo = incoming.mode === 'video';
  const name = callerLabel(incoming.caller);
  const role = incoming.caller?.role === 'doctor' ? 'Doctor' : 'Patient';
  const CallIcon = isVideo ? Video : Phone;

  const accept = (answerMode) => {
    const call = acceptIncoming(answerMode);
    if (!call) return;
    const target = `/consultation/${call.appointmentId}`;
    navigate(target, { replace: location.pathname === target });
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-testid="incoming-call">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
        aria-describedby="incoming-call-status"
        data-mode={incoming.mode}
        data-sound={sound}
        className="w-full max-w-sm bg-slate-900 text-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center"
      >
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center ring-8 ring-emerald-500/10 animate-pulse">
          <CallIcon size={36} className="text-emerald-400" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-2">
          <PhoneIncoming size={14} /> Incoming {isVideo ? 'video' : 'voice'} call
        </p>
        <h2 id="incoming-call-title" className="mt-2 text-2xl font-extrabold text-white break-words">{name}</h2>
        <p className="text-sm text-white/60 font-semibold">{role}</p>
        <p id="incoming-call-status" className="mt-3 text-sm text-white/70" role="status">Ringing...</p>

        {sound === 'blocked' && (
          <button type="button" onClick={enableRingtone} className="mt-4 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-3 rounded-2xl">
            <Volume2 size={18} /> Your browser muted the ringtone. Tap to turn on sound
          </button>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={declineIncoming} className="flex flex-col items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold">
            <PhoneOff size={24} /> Decline
          </button>
          <button ref={acceptRef} type="button" onClick={() => accept()} className="flex flex-col items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold">
            <CallIcon size={24} /> Accept
          </button>
        </div>
        {isVideo && (
          <button type="button" onClick={() => accept('audio')} className="mt-3 w-full flex items-center justify-center gap-2 text-white/80 hover:text-white text-sm font-bold py-2">
            <Phone size={16} /> Answer with audio only (saves data)
          </button>
        )}
      </div>
    </div>
  );
};

export default IncomingCallPopup;
