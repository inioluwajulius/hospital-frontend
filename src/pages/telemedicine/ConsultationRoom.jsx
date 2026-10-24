import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Video, Phone, PhoneOff, PhoneIncoming, Mic, MicOff, VideoOff, Send, Loader2, Wifi, WifiOff,
  User, ArrowLeft, CheckCircle2, ClipboardList, AlertCircle, RotateCw, Signal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';
import { cn } from '../../lib/utils';
import { useConsultationCall, DATA_PER_MINUTE } from '../../hooks/useConsultationCall';
import { Field, TextArea, LoadingBlock } from '../staff/StaffUI';
import { formatDateTime, errorText } from '../staff/staffUtils';

const POLL_MS = 8000;
const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
};
const newClientId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const doctorLabel = (name) => (name ? `Dr. ${String(name).replace(/^Dr\.?\s*/i, '')}` : 'your doctor');

const CallTimer = ({ since }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="tabular-nums">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>;
};

/**
 * /consultation/:id  telemedicine room for the appointment's doctor and patient:
 * low-data audio/video call, persistent chat, and (doctor) patient summary + completion notes.
 */
const ConsultationRoom = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [peerPresent, setPeerPresent] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [iceServers, setIceServers] = useState([{ urls: 'stun:stun.l.google.com:19302' }]);
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState({ diagnosis: '', treatment: '', notes: '' });
  const chatEndRef = useRef(null);

  const participant = data?.participant;
  const appointment = data?.appointment;
  const status = appointment?.status;
  const ended = status === 'completed' || status === 'cancelled';
  const otherName = participant === 'doctor' ? appointment?.patient?.name : doctorLabel(appointment?.doctor?.name);

  const mergeMessages = useCallback((incoming) => {
    setMessages((prev) => {
      const byKey = new Map(prev.map((m) => [m._id || m.clientId, m]));
      for (const m of incoming) {
        // A server copy replaces the optimistic one with the same clientId
        if (m.clientId && byKey.has(m.clientId)) byKey.delete(m.clientId);
        byKey.set(m._id || m.clientId, m);
      }
      return [...byKey.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, []);

  // Load the consultation
  const load = useCallback(async () => {
    try {
      const res = await api.getConsultation(id);
      setData(res.data.data);
      mergeMessages(res.data.data.messages || []);
      setLoadError('');
    } catch (err) {
      setLoadError(err?.response?.status === 404
        ? 'This consultation was not found, or you are not one of its participants.'
        : errorText(err, 'Could not load the consultation.'));
    }
  }, [id, mergeMessages]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getIceServers().then((res) => setIceServers(res.data.data.iceServers)).catch(() => {});
  }, []);

  // Online/offline indicator (rural connectivity drops are expected)
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Real-time room
  useEffect(() => {
    if (!data) return undefined;
    const s = initSocket();
    if (!s) return undefined;
    setSocket(s);
    const join = () => s.emit('consult:join', { appointmentId: id }, (ack) => {
      setJoined(Boolean(ack?.ok));
      setPeerPresent(Boolean(ack?.peers?.length));
    });
    const onPeerJoined = () => { setPeerPresent(true); toast.success(`${participantOther()} joined the room`); };
    const onMessage = (m) => mergeMessages([m]);
    const onStatus = ({ status: next }) => setData((d) => (d ? { ...d, appointment: { ...d.appointment, status: next } } : d));
    const onDisconnect = () => setJoined(false);
    function participantOther() { return data.participant === 'doctor' ? 'The patient' : 'Your doctor'; }

    if (s.connected) join();
    s.on('connect', join); // also re-joins after a reconnect
    s.on('disconnect', onDisconnect);
    s.on('consult:peer-joined', onPeerJoined);
    s.on('consult:message', onMessage);
    s.on('consult:status', onStatus);
    return () => {
      s.emit('consult:leave', { appointmentId: id });
      s.off('connect', join);
      s.off('disconnect', onDisconnect);
      s.off('consult:peer-joined', onPeerJoined);
      s.off('consult:message', onMessage);
      s.off('consult:status', onStatus);
    };
    // Re-run only when the consultation first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(data), id, mergeMessages]);

  const call = useConsultationCall({
    socket: joined ? socket : null,
    appointmentId: id,
    participant,
    iceServers,
    onEvent: (event, mode) => {
      if (event === 'incoming') toast(`Incoming ${mode === 'video' ? 'video' : 'audio'} call`, { icon: '📞' });
      if (event === 'ended') toast('The call ended');
      if (event === 'declined') toast('The call was declined');
    },
  });

  // Peer leaving ends the call
  useEffect(() => {
    if (!socket) return undefined;
    const onPeerLeft = () => { setPeerPresent(false); call.peerLeft(); };
    socket.on('consult:peer-left', onPeerLeft);
    return () => socket.off('consult:peer-left', onPeerLeft);
  }, [socket, call]);

  // Polling fallback keeps chat working when the live connection is down
  useEffect(() => {
    if (!data || joined) return undefined;
    const timer = setInterval(async () => {
      const last = messages.filter((m) => m._id).at(-1)?.createdAt;
      try {
        const res = await api.getConsultationMessages(id, last);
        mergeMessages(res.data.data || []);
      } catch { /* offline; try again next tick */ }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [data, joined, id, messages, mergeMessages]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]);

  const deliver = useCallback(async (msg) => {
    setMessages((prev) => prev.map((m) => (m.clientId === msg.clientId ? { ...m, failed: false, pending: true } : m)));
    try {
      const res = await api.sendConsultationMessage(id, { text: msg.text, clientId: msg.clientId });
      mergeMessages([res.data.data]);
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.clientId === msg.clientId ? { ...m, failed: true, pending: false, error: errorText(err, 'Not sent') } : m)));
    }
  }, [id, mergeMessages]);

  // Resend failed messages when the connection comes back
  useEffect(() => {
    if (online) messages.filter((m) => m.failed).forEach(deliver);
    // Only when connectivity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const msg = { clientId: newClientId(), text, senderRole: participant, createdAt: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, msg]);
    setDraft('');
    deliver(msg);
  };

  const startConsultation = async () => {
    setBusy('start');
    try {
      await api.startConsultation(id);
      setData((d) => ({ ...d, appointment: { ...d.appointment, status: 'in-progress' } }));
      toast.success('Consultation started. The patient has been notified.');
    } catch (err) {
      toast.error(errorText(err, 'Could not start the consultation'));
    } finally {
      setBusy('');
    }
  };

  const completeConsultation = async (e) => {
    e.preventDefault();
    if (!notes.diagnosis.trim() && !notes.notes.trim()) {
      toast.error('Add a diagnosis or consultation notes');
      return;
    }
    setBusy('complete');
    try {
      if (call.callState !== 'idle') call.hangUp();
      await api.completeConsultation(id, notes);
      setData((d) => ({ ...d, appointment: { ...d.appointment, status: 'completed' } }));
      toast.success("Consultation completed. Notes saved to the patient's medical record.");
    } catch (err) {
      toast.error(errorText(err, 'Could not complete the consultation'));
    } finally {
      setBusy('');
    }
  };

  const connection = useMemo(() => {
    if (!online) return { icon: WifiOff, label: 'Offline: messages will send when you reconnect', tone: 'text-red-600 bg-red-50' };
    if (!joined) return { icon: Signal, label: 'Limited connection: chat only (updates every few seconds)', tone: 'text-amber-700 bg-amber-50' };
    return { icon: Wifi, label: peerPresent ? `${otherName || 'The other participant'} is in the room` : `Waiting for ${otherName || 'the other participant'} to join`, tone: peerPresent ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-50' };
  }, [online, joined, peerPresent, otherName]);

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <AlertCircle className="mx-auto text-red-500" size={40} />
        <p className="text-slate-700 font-semibold">{loadError}</p>
        <Link to="/telemedicine" className="inline-flex items-center gap-2 text-primary font-bold"><ArrowLeft size={16} /> Back to telemedicine</Link>
      </div>
    );
  }
  if (!data) return <LoadingBlock text="Opening consultation room..." />;

  const callActive = call.callState !== 'idle';
  const canCall = joined && peerPresent && !ended && status === 'in-progress';
  const ConnIcon = connection.icon;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <Link to="/telemedicine" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary mb-2"><ArrowLeft size={14} /> Telemedicine</Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><Video size={22} /></span>
            Video consultation with {otherName}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{formatDateTime(appointment.appointmentDate)}{appointment.reason ? ` · ${appointment.reason}` : ''}</p>
        </div>
        <span className={cn('self-start md:self-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider', STATUS_STYLES[status])}>{status}</span>
      </div>

      <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold', connection.tone)} role="status">
        <ConnIcon size={16} /> {connection.label}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Call + chat */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-slate-900 rounded-3xl overflow-hidden relative min-h-[300px] flex flex-col">
            {/* Remote media (also plays audio-only calls) */}
            <video ref={call.remoteMediaRef} autoPlay playsInline className={cn('w-full flex-1 object-cover bg-slate-900', (!callActive || call.callMode !== 'video') && 'hidden')} />
            <video ref={call.localVideoRef} autoPlay playsInline muted className={cn('absolute top-4 right-4 w-28 sm:w-36 rounded-xl border-2 border-white/20 shadow-lg bg-slate-800', (!callActive || call.callMode !== 'video' || call.cameraOff) && 'hidden')} />

            {(!callActive || call.callMode !== 'video') && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white">
                <div className={cn('w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4', call.callState === 'in-call' && 'ring-4 ring-emerald-400/40 animate-pulse')}>
                  <User size={36} className="text-white/80" />
                </div>
                <p className="text-lg font-bold text-white">{otherName}</p>
                <p className="text-sm text-white/60 mt-1">
                  {ended ? 'This consultation has ended.'
                    : call.callState === 'in-call' ? <>Audio call · <CallTimer since={call.connectedAt} /></>
                    : call.callState === 'calling' ? 'Calling...'
                    : call.callState === 'connecting' ? 'Connecting...'
                    : call.callState === 'incoming' ? `Incoming ${call.incomingMode} call`
                    : status === 'scheduled' ? (participant === 'doctor' ? 'Start the consultation to begin the call.' : `Waiting for ${otherName} to start the consultation. You can send a message meanwhile.`)
                    : !peerPresent ? `Waiting for ${otherName} to join...`
                    : 'Ready to call'}
                </p>
              </div>
            )}

            {call.callState === 'in-call' && call.callMode === 'video' && (
              <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full"><CallTimer since={call.connectedAt} /></div>
            )}

            {/* Controls */}
            <div className="p-4 bg-slate-950/60 flex flex-wrap items-center justify-center gap-3">
              {call.callState === 'incoming' ? (
                <>
                  <button onClick={() => call.answerCall()} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm">
                    <PhoneIncoming size={18} /> Answer {call.incomingMode === 'video' ? 'with video' : ''}
                  </button>
                  {call.incomingMode === 'video' && (
                    <button onClick={() => call.answerCall('audio')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl font-bold text-sm">
                      <Phone size={18} /> Audio only (save data)
                    </button>
                  )}
                  <button onClick={call.declineCall} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold text-sm">
                    <PhoneOff size={18} /> Decline
                  </button>
                </>
              ) : callActive ? (
                <>
                  <button onClick={call.toggleMute} aria-pressed={call.muted} className={cn('p-3 rounded-2xl text-white', call.muted ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20')} aria-label={call.muted ? 'Unmute' : 'Mute'}>
                    {call.muted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  {call.callMode === 'video' && (
                    <button onClick={call.toggleCamera} aria-pressed={call.cameraOff} className={cn('p-3 rounded-2xl text-white', call.cameraOff ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20')} aria-label={call.cameraOff ? 'Turn camera on' : 'Turn camera off'}>
                      {call.cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                  )}
                  <button onClick={call.hangUp} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold text-sm">
                    <PhoneOff size={18} /> End call
                  </button>
                </>
              ) : (
                <>
                  <button disabled={!canCall} onClick={() => call.startCall('audio')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-2xl font-bold text-sm">
                    <Phone size={18} /> Audio call
                  </button>
                  <button disabled={!canCall} onClick={() => call.startCall('video')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-2xl font-bold text-sm">
                    <Video size={18} /> Video call
                  </button>
                </>
              )}
            </div>
            <p className="text-[11px] text-center text-white/50 pb-3 px-4">
              Data saver: audio uses about {DATA_PER_MINUTE.audio} MB/min, low-resolution video about {DATA_PER_MINUTE.video} MB/min. Chat works even on 2G.
            </p>
          </section>

          {call.error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium" role="alert">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> {call.error}
            </div>
          )}

          {/* Chat */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[420px]">
            <div className="px-6 py-4 border-b border-slate-50 font-extrabold text-slate-900">Consultation chat</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3" aria-live="polite">
              {messages.length === 0 && <p className="text-sm text-slate-400 text-center mt-8">No messages yet. Messages are saved even if your connection drops.</p>}
              {messages.map((m) => {
                const mine = m.senderRole === participant;
                return (
                  <div key={m._id || m.clientId} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm', mine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm')}>
                      <p className={cn('whitespace-pre-wrap break-words', mine ? 'text-white' : 'text-slate-800')}>{m.text}</p>
                      <p className={cn('text-[10px] mt-1', mine ? 'text-emerald-100' : 'text-slate-400')}>
                        {m.pending ? 'Sending...' : m.failed ? (
                          <button type="button" onClick={() => deliver(m)} className="inline-flex items-center gap-1 font-bold underline"><RotateCw size={10} /> Not sent, retry</button>
                        ) : new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-slate-50 flex gap-2">
              <label htmlFor="consult-message" className="sr-only">Message</label>
              <input
                id="consult-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={ended}
                maxLength={2000}
                placeholder={ended ? 'This consultation has ended' : 'Type a message...'}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
              <button type="submit" disabled={ended || !draft.trim()} aria-label="Send message" className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 rounded-xl">
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>

        {/* Side panel */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {participant === 'doctor' ? (
            <>
              <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><User size={18} /> Patient</h2>
                <p className="text-lg font-bold text-slate-900">{appointment.patient.name}</p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-slate-500">Card</dt><dd className="font-semibold text-slate-800">{appointment.patient.patientCardNumber}</dd>
                  <dt className="text-slate-500">Age / sex</dt><dd className="font-semibold text-slate-800">{appointment.patient.age ?? '—'} / {appointment.patient.gender || '—'}</dd>
                  <dt className="text-slate-500">Blood group</dt><dd className="font-semibold text-slate-800">{appointment.patient.bloodGroup || '—'}</dd>
                </dl>
                {appointment.patient.allergies?.length > 0 && (
                  <p className="text-sm font-semibold text-red-700 bg-red-50 rounded-xl px-3 py-2">Allergies: {appointment.patient.allergies.join(', ')}</p>
                )}
                {appointment.patient.currentMedications && <p className="text-sm text-slate-600">Medications: {appointment.patient.currentMedications}</p>}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 leading-normal">Recent history</h3>
                  {data.history.length === 0 ? <p className="text-sm text-slate-400">No previous records.</p> : (
                    <ul className="space-y-2">
                      {data.history.map((r) => (
                        <li key={r._id} className="text-sm bg-slate-50 rounded-xl p-3">
                          <span className="font-bold text-slate-800">{r.diagnosis || 'Consultation'}</span>
                          <span className="block text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {status === 'scheduled' && (
                <button onClick={startConsultation} disabled={busy === 'start'} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-60">
                  {busy === 'start' ? <Loader2 size={20} className="animate-spin" /> : <Video size={20} />} Start consultation
                </button>
              )}

              {status === 'in-progress' && (
                <form onSubmit={completeConsultation} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><ClipboardList size={18} /> Consultation notes</h2>
                  <Field label="Diagnosis"><TextArea rows={2} value={notes.diagnosis} onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })} /></Field>
                  <Field label="Treatment / advice"><TextArea rows={2} value={notes.treatment} onChange={(e) => setNotes({ ...notes, treatment: e.target.value })} /></Field>
                  <Field label="Notes"><TextArea rows={3} value={notes.notes} onChange={(e) => setNotes({ ...notes, notes: e.target.value })} /></Field>
                  <button type="submit" disabled={busy === 'complete'} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                    {busy === 'complete' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Complete consultation
                  </button>
                  <p className="text-xs text-slate-500">Saves the notes to the patient's medical record and ends the consultation.</p>
                </form>
              )}
            </>
          ) : (
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">Your consultation</h2>
              <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">{doctorLabel(appointment.doctor?.name)}</span>{appointment.doctor?.specialization ? ` · ${appointment.doctor.specialization}` : ''}</p>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>Keep this page open; you'll see when your doctor joins.</li>
                <li>On a weak connection, choose an audio call or use chat.</li>
                <li>Your doctor's notes appear in your medical records afterwards.</li>
              </ul>
            </section>
          )}

          {ended && (
            <section className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-sm text-emerald-800 font-medium flex gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>
                {status === 'cancelled' ? 'This consultation was cancelled.' : 'This consultation is complete.'}{' '}
                {status === 'completed' && participant === 'patient' && <Link to="/patient/medical-records" className="font-bold underline">View your records</Link>}
              </span>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ConsultationRoom;
