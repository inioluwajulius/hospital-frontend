import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, Send, Settings2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import UserAccountPanel from '../../component/users/UserAccountPanel';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { PageHeader, PrimaryButton, SecondaryButton, SearchInput, Panel, Modal, Field, TextInput, Select, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from '../staff/StaffUI';
import { listOf, errorText, formatDate, ROLE_LABELS, getCurrentUser } from '../staff/staffUtils';

// Roles the backend allows a hospital admin to invite
const INVITABLE_ROLES = ['doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist', 'accountant'];
const STATUS_TONES = { active: 'green', pending: 'amber', rejected: 'red', inactive: 'slate', suspended: 'red' };
const EMPTY_INVITE = { name: '', email: '', role: '', department: '' };

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  // ?user=<id> opens that account directly (used by the Doctors page "Edit" button)
  const [params, setParams] = useSearchParams();
  const selected = params.get('user');
  const openUser = (id) => setParams(id ? { user: id } : {});
  const me = getCurrentUser();

  const loadStaff = async () => {
    try {
      setLoading(true);
      setStaff(listOf(await api.getStaff()));
    } catch (error) {
      toast.error(errorText(error, 'Could not load staff'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((s) => !roleFilter || s.role === roleFilter)
      .filter((s) => !statusFilter || s.status === statusFilter)
      .filter((s) => !q || [s.name, s.email, s.department].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [staff, search, roleFilter, statusFilter]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!invite.name.trim() || !invite.email.trim() || !invite.role) {
      toast.error('Name, email and role are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.inviteStaff({ ...invite, email: invite.email.trim().toLowerCase() });
      toast.success(`Invitation sent to ${invite.email}`);
      setIsInviteOpen(false);
      setInvite(EMPTY_INVITE);
      loadStaff();
    } catch (error) {
      toast.error(errorText(error, 'Could not send the invitation'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (member) => {
    try {
      setResending((prev) => ({ ...prev, [member._id]: true }));
      await api.resendInvitation(member._id);
      toast.success(`Invitation resent to ${member.email}`);
    } catch (error) {
      toast.error(errorText(error, 'Could not resend the invitation'));
    } finally {
      setResending((prev) => ({ ...prev, [member._id]: false }));
    }
  };

  const setField = (e) => setInvite((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const roleOptions = INVITABLE_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }));

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={Users}
        title="Staff"
        description="Invite nurses, receptionists, lab technicians, pharmacists, radiologists and accountants."
        action={<PrimaryButton onClick={() => setIsInviteOpen(true)}><UserPlus size={18} /> Invite Staff</PrimaryButton>}
      />

      <Panel>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or department..." />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} placeholder="All roles"
            options={[...roleOptions, { value: 'hospital_admin', label: 'Hospital Admin' }]} className="md:w-56" />
          <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All statuses" className="md:w-48"
            options={['active', 'pending', 'inactive', 'suspended'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        </div>
        {loading ? (
          <LoadingBlock text="Loading staff..." />
        ) : visible.length === 0 ? (
          <EmptyRow>No staff members found.</EmptyRow>
        ) : (
          <div className="divide-y divide-slate-50">
            {visible.map((m) => (
              <div key={m._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black shrink-0">
                  {m.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {m.email} · {ROLE_LABELS[m.role] || m.role}{m.department ? ` · ${m.department}` : ''} · added {formatDate(m.createdAt)}
                  </p>
                </div>
                <StatusBadge tone={STATUS_TONES[m.status] || 'slate'}>{m.status === 'pending' && m.invited ? 'invited' : m.status}</StatusBadge>
                {m.status === 'pending' && m.invited && (
                  <SecondaryButton onClick={() => handleResend(m)} disabled={resending[m._id]}>
                    <Send size={16} /> Resend invite
                  </SecondaryButton>
                )}
                <SecondaryButton onClick={() => openUser(m._id)} aria-label={`Manage ${m.name}`}>
                  <Settings2 size={16} /> Manage
                </SecondaryButton>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {selected && (
        <UserAccountPanel
          basePath="/hospital-admin/staff"
          userId={selected}
          assignableRoles={INVITABLE_ROLES}
          currentUserId={me?.id}
          onClose={() => openUser(null)}
          onUpdated={(updated) => setStaff((list) => list.map((s) => (s._id === updated._id ? { ...s, ...updated } : s)))}
        />
      )}

      <Modal open={isInviteOpen} title="Invite staff member" onClose={() => setIsInviteOpen(false)}>
        <form onSubmit={handleInvite} className="space-y-4">
          <Field label="Full name"><TextInput name="name" value={invite.name} onChange={setField} required /></Field>
          <Field label="Email"><TextInput name="email" type="email" value={invite.email} onChange={setField} required /></Field>
          <Field label="Role"><Select name="role" value={invite.role} onChange={setField} options={roleOptions} placeholder="Select role" /></Field>
          <Field label="Department (optional)"><TextInput name="department" value={invite.department} onChange={setField} /></Field>
          <p className="text-xs text-slate-500">They'll get an email with a link to set their password. The link expires in 7 days.</p>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setIsInviteOpen(false)} submitting={submitting} label="Send invitation" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStaff;
