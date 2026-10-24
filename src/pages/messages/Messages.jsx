import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Plus, ArrowLeft, RotateCw, CheckCheck, Check, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';
import { cn } from '../../lib/utils';
import { PageHeader, Panel, Modal, LoadingBlock, EmptyRow, SearchInput } from '../staff/StaffUI';
import { getCurrentUser, errorText } from '../staff/staffUtils';

const POLL_MS = 10000;
const newClientId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const displayName = (other, role) => (role === 'patient' && other?.name ? `Dr. ${String(other.name).replace(/^Dr\.?\s*/i, '')}` : other?.name || 'Unknown');
const timeLabel = (iso) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * /messages  patient-doctor messaging. Patients can message doctors they have
 * appointments with; doctors can message their patients. Messages are stored on the
 * server, delivered live over Socket.IO, and polled when the live connection is down.
 */
const Messages = () => {
  const me = getCurrentUser();
  const role = me?.role;
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [socketUp, setSocketUp] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const endRef = useRef(null);
  const activeRef = useRef(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  useEffect(() => { activeRef.current = activeId; }, [activeId]);

  const active = conversations.find((c) => c._id === activeId);
  const myRole = role === 'doctor' ? 'doctor' : 'patient';

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.data);
    } catch (err) {
      toast.error(errorText(err, 'Could not load conversations'));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const merge = useCallback((incoming) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m._id || m.clientId, m]));
      for (const m of incoming) {
        if (m.clientId && map.has(m.clientId)) map.delete(m.clientId);
        map.set(m._id || m.clientId, m);
      }
      return [...map.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, []);

  const markRead = useCallback(async (conversationId) => {
    try {
      await api.post(`/messages/conversations/${conversationId}/read`);
      setConversations((list) => list.map((c) => (c._id === conversationId ? { ...c, unread: 0 } : c)));
    } catch { /* not critical */ }
  }, []);

  // Open a conversation
  useEffect(() => {
    if (!activeId) return;
    setLoadingThread(true);
    setMessages([]);
    api.get(`/messages/conversations/${activeId}/messages`)
      .then((res) => { merge(res.data.data); setHasMore(res.data.hasMore); markRead(activeId); })
      .catch((err) => toast.error(errorText(err, 'Could not load messages')))
      .finally(() => setLoadingThread(false));
  }, [activeId, merge, markRead]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length, activeId]);

  // Live updates
  useEffect(() => {
    const s = initSocket();
    if (!s) return undefined;
    const up = () => setSocketUp(true);
    const down = () => setSocketUp(false);
    const onNew = ({ conversationId, message }) => {
      if (conversationId === activeRef.current) {
        merge([message]);
        if (message.senderRole !== myRole) markRead(conversationId);
      }
      setConversations((list) => {
        const exists = list.some((c) => c._id === conversationId);
        if (!exists) { loadConversations(); return list; }
        return list
          .map((c) => (c._id === conversationId ? {
            ...c,
            lastMessageAt: message.createdAt,
            lastMessageText: message.text.slice(0, 140),
            lastSenderRole: message.senderRole,
            unread: message.senderRole !== myRole && conversationId !== activeRef.current ? (c.unread || 0) + 1 : c.unread,
          } : c))
          .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    };
    const onRead = ({ conversationId }) => {
      if (conversationId === activeRef.current) {
        setMessages((list) => list.map((m) => (m.senderRole === myRole && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)));
      }
    };
    setSocketUp(s.connected);
    s.on('connect', up);
    s.on('disconnect', down);
    s.on('message:new', onNew);
    s.on('message:read', onRead);
    return () => { s.off('connect', up); s.off('disconnect', down); s.off('message:new', onNew); s.off('message:read', onRead); };
  }, [merge, markRead, loadConversations, myRole]);

  // Polling fallback when the live connection is down
  useEffect(() => {
    if (socketUp) return undefined;
    const timer = setInterval(async () => {
      loadConversations();
      if (!activeRef.current) return;
      const last = messages.filter((m) => m._id).at(-1)?.createdAt;
      try {
        const res = await api.get(`/messages/conversations/${activeRef.current}/messages`, last ? { params: { after: last } } : undefined);
        merge(res.data.data);
      } catch { /* try again next tick */ }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [socketUp, messages, merge, loadConversations]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const loadOlder = async () => {
    const oldest = messages.find((m) => m._id)?.createdAt;
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const res = await api.get(`/messages/conversations/${activeId}/messages`, { params: { before: oldest } });
      merge(res.data.data);
      setHasMore(res.data.hasMore);
    } catch (err) {
      toast.error(errorText(err, 'Could not load earlier messages'));
    } finally {
      setLoadingOlder(false);
    }
  };

  const deliver = useCallback(async (msg, conversationId) => {
    setMessages((list) => list.map((m) => (m.clientId === msg.clientId ? { ...m, failed: false, pending: true } : m)));
    try {
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, { text: msg.text, clientId: msg.clientId });
      merge([res.data.data]);
    } catch (err) {
      setMessages((list) => list.map((m) => (m.clientId === msg.clientId ? { ...m, failed: true, pending: false } : m)));
      if (err?.response) toast.error(errorText(err, 'Message not sent'));
    }
  }, [merge]);

  // Resend failed messages when the connection returns
  useEffect(() => {
    if (online && activeId) messages.filter((m) => m.failed).forEach((m) => deliver(m, activeId));
    // Only when connectivity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    const msg = { clientId: newClientId(), text, senderRole: myRole, createdAt: new Date().toISOString(), pending: true };
    setMessages((list) => [...list, msg]);
    setDraft('');
    deliver(msg, activeId);
  };

  const openContacts = async () => {
    setContactsOpen(true);
    setContactsLoading(true);
    try {
      const res = await api.get('/messages/contacts');
      setContacts(res.data.data);
    } catch (err) {
      toast.error(errorText(err, 'Could not load contacts'));
    } finally {
      setContactsLoading(false);
    }
  };

  const startConversation = async (contact) => {
    try {
      const res = await api.post('/messages/conversations', role === 'doctor' ? { patientId: contact.id } : { doctorId: contact.id });
      const conv = res.data.data;
      setConversations((list) => (list.some((c) => c._id === conv._id) ? list : [conv, ...list]));
      setActiveId(conv._id);
      setContactsOpen(false);
    } catch (err) {
      toast.error(errorText(err, 'Could not open the conversation'));
    }
  };

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return contacts.filter((c) => !q || [c.name, c.detail].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [contacts, contactSearch]);

  const totalUnread = conversations.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        icon={MessageSquare}
        title="Messages"
        description={role === 'doctor' ? 'Secure messages with your patients.' : 'Message the doctors who care for you. For emergencies, call the hospital.'}
        action={
          <button onClick={openContacts} className="bg-primary text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus size={18} /> New message
          </button>
        }
      />

      {(!online || !socketUp) && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-amber-50 text-amber-700" role="status">
          <WifiOff size={16} /> {online ? 'Live updates unavailable: checking for new messages every few seconds.' : 'You are offline: messages will send when you reconnect.'}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Conversation list */}
        <Panel className={cn('col-span-12 lg:col-span-4 h-fit', activeId && 'hidden lg:block')}>
          <div className="px-5 py-4 border-b border-slate-50 font-extrabold text-slate-900 flex items-center justify-between">
            Conversations {totalUnread > 0 && <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5" aria-label={`${totalUnread} unread`}>{totalUnread}</span>}
          </div>
          {loadingList ? <LoadingBlock text="Loading..." /> : conversations.length === 0 ? (
            <EmptyRow>No conversations yet. Start one with “New message”.</EmptyRow>
          ) : (
            <ul className="divide-y divide-slate-50">
              {conversations.map((c) => (
                <li key={c._id}>
                  <button type="button" onClick={() => setActiveId(c._id)}
                    className={cn('w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors', activeId === c._id && 'bg-emerald-50/60')}>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center justify-center font-black shrink-0">{c.other?.name?.charAt(0) || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <span className={cn('truncate text-slate-900', c.unread ? 'font-extrabold' : 'font-bold')}>{displayName(c.other, role)}</span>
                        {c.lastMessageAt && <span className="text-[10px] text-slate-400 shrink-0 mt-1">{timeLabel(c.lastMessageAt)}</span>}
                      </div>
                      <p className={cn('text-xs truncate', c.unread ? 'text-slate-800 font-semibold' : 'text-slate-500')}>
                        {c.lastMessageText ? `${c.lastSenderRole === myRole ? 'You: ' : ''}${c.lastMessageText}` : c.other?.detail || 'No messages yet'}
                      </p>
                    </div>
                    {c.unread > 0 && <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center mt-1">{c.unread}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Thread */}
        <Panel className={cn('col-span-12 lg:col-span-8 flex flex-col h-[560px]', !activeId && 'hidden lg:flex')}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare size={40} />
              <p className="mt-3 text-sm font-medium">Select a conversation or start a new one.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
                <button type="button" onClick={() => setActiveId(null)} className="lg:hidden p-1 text-slate-500" aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                <div>
                  <p className="font-extrabold text-slate-900">{displayName(active.other, role)}</p>
                  {active.other?.detail && <p className="text-xs text-slate-500">{active.other.detail}</p>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3" aria-live="polite">
                {hasMore && (
                  <div className="text-center">
                    <button type="button" onClick={loadOlder} disabled={loadingOlder} className="text-xs font-bold text-primary hover:underline disabled:opacity-50">
                      {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                    </button>
                  </div>
                )}
                {loadingThread ? <LoadingBlock text="Loading messages..." /> : messages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center mt-10">No messages yet. Say hello.</p>
                ) : messages.map((m) => {
                  const mine = m.senderRole === myRole;
                  return (
                    <div key={m._id || m.clientId} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm', mine ? 'bg-emerald-600 rounded-br-sm' : 'bg-slate-100 rounded-bl-sm')}>
                        <p className={cn('whitespace-pre-wrap break-words', mine ? 'text-white' : 'text-slate-800')}>{m.text}</p>
                        <p className={cn('text-[10px] mt-1 flex items-center gap-1', mine ? 'text-emerald-100 justify-end' : 'text-slate-400')}>
                          {m.pending ? 'Sending...' : m.failed ? (
                            <button type="button" onClick={() => deliver(m, activeId)} className="inline-flex items-center gap-1 font-bold underline"><RotateCw size={10} /> Not sent, retry</button>
                          ) : (
                            <>
                              {timeLabel(m.createdAt)}
                              {mine && (m.readAt ? <CheckCheck size={12} aria-label="Read" /> : <Check size={12} aria-label="Delivered" />)}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="p-4 border-t border-slate-50 flex gap-2">
                <label htmlFor="message-input" className="sr-only">Message</label>
                <input id="message-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <button type="submit" disabled={!draft.trim()} aria-label="Send message" className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 rounded-xl">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </Panel>
      </div>

      <Modal open={contactsOpen} title={role === 'doctor' ? 'Message a patient' : 'Message a doctor'} onClose={() => setContactsOpen(false)}>
        <SearchInput value={contactSearch} onChange={setContactSearch} placeholder="Search..." />
        <p className="text-xs text-slate-500">
          {role === 'doctor' ? 'Patients who have an appointment with you.' : 'Doctors you have an appointment with. Book an appointment to message a new doctor.'}
        </p>
        {contactsLoading ? <LoadingBlock text="Loading contacts..." /> : filteredContacts.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">{contacts.length ? 'No matches.' : 'Nobody to message yet.'}</p>
        ) : (
          <ul className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {filteredContacts.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => startConversation(c)} className="w-full text-left py-3 px-2 hover:bg-slate-50 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-black">{c.name?.charAt(0) || '?'}</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{displayName(c, role)}</p>
                    {c.detail && <p className="text-xs text-slate-500">{c.detail}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default Messages;
