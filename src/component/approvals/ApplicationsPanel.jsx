import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Mail, Award, Clock, Phone, Building2, Eye, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { initSocket } from '../../services/socket';
import { Panel, SearchInput, SecondaryButton, PrimaryButton, Modal, StatusBadge, TextArea, Field, EmptyRow, LoadingBlock } from '../../pages/staff/StaffUI';
import { errorText, formatDate, formatDateTime } from '../../pages/staff/staffUtils';

const ROLE_LABEL = { doctor: 'Doctor', nurse: 'Nurse' };

/**
 * Doctor/nurse applications awaiting a decision, backed by GET /users/registrations/pending.
 * - Hospital admins: always their own hospital (the server takes it from the login token).
 * - Super admin: pass `hospitalId` to scope to one hospital, or omit it to see all hospitals.
 * Refreshes itself when a new application arrives or another admin decides one.
 */
const ApplicationsPanel = ({ hospitalId, showHospital = false, highlightId, onCountChange }) => {
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState({});
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const highlightRef = useRef(null);
  const requestId = useRef(0);

  const load = useCallback(async ({ quiet = false } = {}) => {
    const current = ++requestId.current;
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab });
      if (search.trim()) params.set('search', search.trim());
      if (hospitalId) params.set('hospitalId', hospitalId);
      const res = await api.get(`/users/registrations/pending?${params}`);
      if (current !== requestId.current) return; // a newer request superseded this one
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setItems(list);
      setLoadError('');
      if (tab === 'pending' && !search.trim()) onCountChange?.(list.length);
    } catch (err) {
      if (current !== requestId.current) return;
      setLoadError(errorText(err, err.response ? 'Could not load applications.' : "Couldn't reach the server. Check your connection and try again."));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [tab, search, hospitalId, onCountChange]);

  useEffect(() => {
    const timer = setTimeout(() => load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  // Live updates: a new registration notification, or a decision made in another session
  useEffect(() => {
    const socket = initSocket();
    if (!socket) return undefined;
    const onNotification = (n) => { if (n?.type === 'REGISTRATION') load({ quiet: true }); };
    const onChanged = () => load({ quiet: true });
    socket.on('new_notification', onNotification);
    socket.on('applications:changed', onChanged);
    // Also catch up when the admin returns to the tab (covers a dropped socket)
    const onFocus = () => load({ quiet: true });
    window.addEventListener('focus', onFocus);
    return () => {
      socket.off('new_notification', onNotification);
      socket.off('applications:changed', onChanged);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  // Opened from a notification: open that application once it has loaded
  const openedHighlight = useRef(false);
  useEffect(() => {
    if (!highlightId || openedHighlight.current || loading) return;
    openedHighlight.current = true;
    const match = items.find((a) => a._id === highlightId);
    if (match) {
      setViewing(match);
      return;
    }
    // Not pending any more (or not in this hospital): explain instead of showing nothing
    api.get(`/users/registrations/${highlightId}${hospitalId ? `?hospitalId=${hospitalId}` : ''}`)
      .then((res) => {
        const app = res.data?.data;
        if (app) {
          setViewing(app);
          if (app.status !== 'pending') toast(`${app.name}'s application was already ${app.status === 'active' ? 'approved' : app.status}.`);
        }
      })
      .catch((err) => toast.error(errorText(err, 'That application could not be found in this hospital.')));
  }, [highlightId, items, loading, hospitalId]);

  useEffect(() => {
    highlightRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [items]);

  const decide = async (application, decision, rejectionReason) => {
    setBusy((b) => ({ ...b, [application._id]: decision }));
    try {
      const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
      const res = decision === 'approve'
        ? await api.put(`/users/${application._id}/approve${query}`)
        : await api.put(`/users/${application._id}/reject${query}`, { reason: rejectionReason });
      toast.success(res.data?.message || (decision === 'approve' ? 'Application approved' : 'Application rejected'));
      setItems((list) => {
        const next = list.filter((a) => a._id !== application._id);
        if (tab === 'pending') onCountChange?.(next.length);
        return next;
      });
      setViewing(null);
      setRejecting(null);
      setReason('');
    } catch (err) {
      toast.error(errorText(err, decision === 'approve' ? 'Could not approve the application' : 'Could not reject the application'));
      // Already decided elsewhere: show the current state
      if (err.response?.status === 409 || err.response?.status === 404) {
        setViewing(null);
        setRejecting(null);
        load({ quiet: true });
      }
    } finally {
      setBusy((b) => ({ ...b, [application._id]: undefined }));
    }
  };

  const tabs = [
    { key: 'pending', label: 'Awaiting approval' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <Panel>
      <div className="p-4 sm:p-5 border-b border-slate-50 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex gap-2" role="tablist" aria-label="Application status">
          {tabs.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t.key ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full lg:w-auto">
          <div className="flex-1 min-w-0 md:flex-none md:w-96">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, specialty, license..." />
          </div>
          <SecondaryButton type="button" onClick={() => load()} aria-label="Refresh applications" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </SecondaryButton>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <LoadingBlock text="Loading applications..." />
      ) : loadError ? (
        <div className="p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="text-amber-500" size={28} />
          <p className="text-sm text-slate-600 font-medium max-w-md">{loadError}</p>
          <SecondaryButton type="button" onClick={() => load()}>Try again</SecondaryButton>
        </div>
      ) : items.length === 0 ? (
        <EmptyRow>
          {search ? 'No applications match your search.'
            : tab === 'pending' ? 'No applications are waiting for approval. New doctor and nurse registrations will appear here automatically.'
            : 'No rejected applications.'}
        </EmptyRow>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map((a) => (
            <div key={a._id} ref={a._id === highlightId ? highlightRef : null} data-application={a._id}
              className={`p-5 flex flex-col md:flex-row md:items-center gap-4 ${a._id === highlightId ? 'bg-amber-50/60' : ''}`}>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                {a.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900">{a.name}</p>
                  <StatusBadge tone={a.role === 'doctor' ? 'blue' : 'slate'}>{ROLE_LABEL[a.role] || a.role}</StatusBadge>
                  {!a.emailVerified && <StatusBadge tone="amber">Email not verified</StatusBadge>}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {a.email}{a.specialization ? ` · ${a.specialization}` : ''}{a.licenseNumber ? ` · License ${a.licenseNumber}` : ''}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Applied {formatDate(a.appliedAt)}{showHospital && a.hospital?.name ? ` · ${a.hospital.name}` : ''}
                  {tab === 'rejected' && a.rejectionReason ? ` · Reason: ${a.rejectionReason}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <SecondaryButton type="button" onClick={() => setViewing(a)} aria-label={`View application from ${a.name}`}>
                  <Eye size={16} /> View
                </SecondaryButton>
                {tab === 'pending' && (
                  <>
                    <SecondaryButton type="button" disabled={!!busy[a._id]} onClick={() => { setRejecting(a); setReason(''); }}
                      aria-label={`Reject ${a.name}`} className="hover:text-red-600 hover:border-red-200">
                      <XCircle size={16} /> Reject
                    </SecondaryButton>
                    <PrimaryButton type="button" disabled={!!busy[a._id]} onClick={() => decide(a, 'approve')} aria-label={`Approve ${a.name}`} className="px-4 py-2.5 rounded-xl">
                      {busy[a._id] === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve
                    </PrimaryButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!viewing} title="Application" onClose={() => setViewing(null)}>
        {viewing && (
          <>
            <div>
              <p className="text-lg font-extrabold text-slate-900">{viewing.name}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <StatusBadge tone={viewing.role === 'doctor' ? 'blue' : 'slate'}>{ROLE_LABEL[viewing.role] || viewing.role}</StatusBadge>
                <StatusBadge tone={viewing.status === 'pending' ? 'amber' : viewing.status === 'active' ? 'green' : 'red'}>
                  {viewing.status === 'active' ? 'Approved' : viewing.status === 'pending' ? 'Awaiting approval' : 'Rejected'}
                </StatusBadge>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                [Mail, 'Email', viewing.email],
                [Phone, 'Phone', viewing.phone],
                [Award, 'License number', viewing.licenseNumber],
                [Award, 'Specialization', viewing.specialization],
                [Clock, 'Experience', viewing.yearsOfExperience != null ? `${viewing.yearsOfExperience} years` : null],
                [Building2, 'Hospital', viewing.hospital?.name],
                [Clock, 'Applied', formatDateTime(viewing.appliedAt)],
                [Mail, 'Email verified', viewing.emailVerified ? 'Yes' : 'Not yet (they must verify before they can log in)'],
              ].filter(([, , value]) => value).map(([Icon, label, value]) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-3">
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Icon size={12} /> {label}</dt>
                  <dd className="font-bold text-slate-700 break-words">{value}</dd>
                </div>
              ))}
            </dl>
            {viewing.rejectionReason && (
              <p className="text-sm text-red-700 bg-red-50 rounded-2xl p-3"><span className="font-bold">Rejection reason:</span> {viewing.rejectionReason}</p>
            )}
            {viewing.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <SecondaryButton type="button" className="flex-1 py-3 rounded-2xl" disabled={!!busy[viewing._id]}
                  onClick={() => { setRejecting(viewing); setReason(''); setViewing(null); }}>
                  <XCircle size={16} /> Reject
                </SecondaryButton>
                <PrimaryButton type="button" className="flex-[2]" disabled={!!busy[viewing._id]} onClick={() => decide(viewing, 'approve')}>
                  {busy[viewing._id] === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve and activate
                </PrimaryButton>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={!!rejecting} title="Reject application" onClose={() => !busy[rejecting?._id] && setRejecting(null)}>
        {rejecting && (
          <form onSubmit={(e) => { e.preventDefault(); decide(rejecting, 'reject', reason); }} className="space-y-4">
            <p className="text-sm text-slate-600">
              {rejecting.name} will not be able to log in. They'll be told by email{reason.trim() ? ', including your reason' : ''}. The application is kept for your records.
            </p>
            <Field label="Reason (optional, shared with the applicant)">
              <TextArea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="e.g. We could not verify your license number" />
            </Field>
            <div className="flex gap-3">
              <SecondaryButton type="button" className="flex-1 py-3 rounded-2xl" onClick={() => setRejecting(null)} disabled={!!busy[rejecting._id]}>Cancel</SecondaryButton>
              <button type="submit" disabled={!!busy[rejecting._id]}
                className="flex-[2] py-3 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {busy[rejecting._id] === 'reject' && <Loader2 size={16} className="animate-spin" />} Reject application
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Panel>
  );
};

export default ApplicationsPanel;
