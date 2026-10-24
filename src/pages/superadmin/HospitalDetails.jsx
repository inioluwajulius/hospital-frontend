import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Users, Stethoscope, UserCog, CalendarClock, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Panel, SearchInput, Select, StatusBadge, LoadingBlock, EmptyRow, Modal, SecondaryButton } from '../staff/StaffUI';
import { ROLE_LABELS, errorText, formatDate, getCurrentUser } from '../staff/staffUtils';
import UserAccountPanel from '../../component/users/UserAccountPanel';
import ApplicationsPanel from '../../component/approvals/ApplicationsPanel';

const TABS = [
  { key: '', label: 'All staff' },
  { key: 'hospital_admin', label: 'Admins' },
  { key: 'doctor', label: 'Doctors' },
  { key: 'nurse', label: 'Nurses' },
  { key: 'staff', label: 'Other staff' },
  { key: 'patient', label: 'Patients' },
];
const STATUS_TONES = { active: 'green', pending: 'amber', inactive: 'slate', suspended: 'red', rejected: 'red' };
const SUPER_ADMIN_ROLES = ['doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist', 'accountant', 'hospital_admin'];

const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider"><Icon size={14} /> {label}</div>
    <div className="text-3xl font-extrabold text-slate-900 mt-2">{value ?? '—'}</div>
  </div>
);

/** /superadmin/hospitals/:id  one hospital's profile, status and users */
const HospitalDetails = () => {
  const { id } = useParams();
  const me = getCurrentUser();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [usersLoading, setUsersLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadHospital = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([api.get(`/superadmin/hospitals/${id}`), api.get(`/superadmin/hospitals/${id}/stats`)]);
      setHospital(h.data.data);
      setStats(s.data.data);
    } catch (err) {
      setError(err?.response?.status === 404 ? 'This hospital was not found.' : errorText(err, 'Could not load the hospital.'));
    }
  }, [id]);

  useEffect(() => { loadHospital(); }, [loadHospital]);

  // Users: server-side filtering by role/status/search with pagination
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '15' });
        if (tab) params.set('role', tab);
        if (status) params.set('status', status);
        if (search.trim()) params.set('search', search.trim());
        const res = await api.get(`/superadmin/hospitals/${id}/users?${params}`);
        if (!cancelled) { setUsers(res.data.data); setPagination(res.data.pagination); }
      } catch (err) {
        if (!cancelled) toast.error(errorText(err, 'Could not load users'));
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }, search ? 300 : 0); // debounce typing
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id, tab, status, search, page]);

  const changeHospitalStatus = async () => {
    setBusy(true);
    try {
      const res = await api.patch(`/superadmin/hospitals/${id}/status`, { status: statusConfirm });
      setHospital((h) => ({ ...h, status: res.data?.data?.status || statusConfirm }));
      toast.success(statusConfirm === 'active' ? 'Hospital activated' : 'Hospital suspended');
    } catch (err) {
      toast.error(errorText(err, 'Could not change the hospital status'));
    } finally {
      setBusy(false);
      setStatusConfirm(null);
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <ShieldAlert className="mx-auto text-red-500" size={40} />
        <p className="text-slate-700 font-semibold">{error}</p>
        <Link to="/superadmin/hospitals" className="inline-flex items-center gap-2 text-primary font-bold"><ArrowLeft size={16} /> Back to hospitals</Link>
      </div>
    );
  }
  if (!hospital) return <LoadingBlock text="Loading hospital..." />;

  const address = [hospital.address?.street, hospital.address?.city, hospital.address?.state, hospital.address?.country].filter(Boolean).join(', ');
  const isActive = hospital.status === 'active';

  return (
    <div className="space-y-6 pb-10">
      <Link to="/superadmin/hospitals" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary"><ArrowLeft size={16} /> Registered hospitals</Link>

      {/* Profile */}
      <Panel className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100"><Building2 size={28} /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{hospital.name}</h1>
              <p className="text-sm text-slate-500 font-medium">{hospital.customDomain || hospital.subdomain || hospital.slug} · Registered {formatDate(hospital.createdAt)}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge tone={isActive ? 'green' : 'red'}>{hospital.status}</StatusBadge>
                <StatusBadge tone="blue">{hospital.subscriptionTier || 'free'} plan</StatusBadge>
                {hospital.metadata?.hospitalType && <StatusBadge tone="slate">{hospital.metadata.hospitalType}</StatusBadge>}
              </div>
            </div>
          </div>
          <SecondaryButton
            type="button"
            onClick={() => setStatusConfirm(isActive ? 'suspended' : 'active')}
            className={isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}
          >
            {isActive ? 'Suspend hospital' : 'Activate hospital'}
          </SecondaryButton>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 text-sm">
          <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrator</dt><dd className="font-semibold text-slate-800 mt-1">{hospital.superAdmin?.name || '—'}<span className="block text-xs text-slate-500 font-medium">{hospital.superAdmin?.email}</span></dd></div>
          <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</dt><dd className="font-semibold text-slate-800 mt-1 space-y-1">
            <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {hospital.contact?.email || '—'}</span>
            <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {hospital.contact?.phone || '—'}</span>
          </dd></div>
          <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</dt><dd className="font-semibold text-slate-800 mt-1 flex items-start gap-2"><MapPin size={14} className="text-slate-400 mt-0.5" /> {address || '—'}</dd></div>
          <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration no.</dt><dd className="font-semibold text-slate-800 mt-1">{hospital.metadata?.registrationNumber || '—'}</dd></div>
          <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax ID</dt><dd className="font-semibold text-slate-800 mt-1">{hospital.metadata?.taxId || '—'}</dd></div>
          <div><dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">User limit</dt><dd className="font-semibold text-slate-800 mt-1">{hospital.maxUsers ?? '—'}</dd></div>
        </dl>
      </Panel>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Stat icon={Stethoscope} label="Doctors" value={stats?.doctors} />
        <Stat icon={Users} label="Other staff" value={stats?.staff} />
        <Stat icon={UserCog} label="Admins" value={stats?.admins} />
        <Stat icon={Users} label="Patients" value={stats?.patients} />
        <Stat icon={CalendarClock} label="Upcoming appts" value={stats?.upcomingAppointments} />
        <Stat icon={ShieldAlert} label="Unverified" value={stats?.unverified} />
      </div>

      {/* Doctor/nurse applications for this hospital only */}
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-slate-900">Staff applications</h2>
        <ApplicationsPanel hospitalId={id} />
      </section>

      {/* Users */}
      <Panel>
        <div className="p-6 border-b border-slate-50 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Users</h2>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl w-fit" role="tablist">
            {TABS.map((t) => (
              <button key={t.key || 'all'} role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, email or phone..." />
            <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses" className="md:w-48"
              options={['active', 'pending', 'inactive', 'suspended'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
          </div>
        </div>
        {usersLoading ? <LoadingBlock text="Loading users..." /> : users.length === 0 ? <EmptyRow>No users match these filters.</EmptyRow> : (
          <div className="divide-y divide-slate-50">
            {users.map((u) => (
              <button key={u._id} type="button" onClick={() => setSelected(u._id)} className="w-full text-left p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center justify-center font-black shrink-0">{u.name?.charAt(0) || '?'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''} · joined {formatDate(u.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="blue">{ROLE_LABELS[u.role] || u.role}</StatusBadge>
                  <StatusBadge tone={STATUS_TONES[u.status] || 'slate'}>{u.status}</StatusBadge>
                  {!u.isEmailVerified && u.emailVerificationRequired && <StatusBadge tone="amber">unverified</StatusBadge>}
                </div>
              </button>
            ))}
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-50 flex items-center justify-between text-sm text-slate-500">
            <span>{pagination.total} users · page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <SecondaryButton type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={16} /></SecondaryButton>
              <SecondaryButton type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={16} /></SecondaryButton>
            </div>
          </div>
        )}
      </Panel>

      {selected && (
        <UserAccountPanel
          basePath={`/superadmin/hospitals/${id}/users`}
          userId={selected}
          assignableRoles={SUPER_ADMIN_ROLES}
          currentUserId={me?.id}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => setUsers((list) => list.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)))}
        />
      )}

      <Modal open={!!statusConfirm} title={statusConfirm === 'active' ? 'Activate hospital' : 'Suspend hospital'} onClose={() => setStatusConfirm(null)}>
        <p className="text-sm text-slate-600">
          {statusConfirm === 'active'
            ? `${hospital.name} will be able to use the platform again.`
            : `${hospital.name}'s administrators will lose access to hospital management until you reactivate it. No data is deleted.`}
        </p>
        <div className="flex gap-3 pt-2">
          <SecondaryButton type="button" onClick={() => setStatusConfirm(null)} disabled={busy} className="flex-1 py-3 rounded-2xl">Cancel</SecondaryButton>
          <button type="button" onClick={changeHospitalStatus} disabled={busy}
            className={`flex-[2] py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-60 ${statusConfirm === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {busy ? 'Working...' : statusConfirm === 'active' ? 'Activate' : 'Suspend'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalDetails;
