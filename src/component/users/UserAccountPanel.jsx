import React, { useEffect, useState } from 'react';
import { KeyRound, Mail, Save, ShieldCheck, ShieldOff, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Modal, Field, TextInput, Select, PrimaryButton, SecondaryButton, StatusBadge, LoadingBlock } from '../../pages/staff/StaffUI';
import { ROLE_LABELS, errorText, formatDate, formatDateTime } from '../../pages/staff/staffUtils';

const STATUS_TONES = { active: 'green', pending: 'amber', inactive: 'slate', suspended: 'red', rejected: 'red' };
const PROFESSIONAL_ROLES = ['doctor', 'nurse', 'radiologist', 'lab_technician', 'pharmacist'];

/** Small confirmation dialog for consequential actions */
const Confirm = ({ open, title, body, confirmLabel, tone = 'danger', busy, onConfirm, onCancel }) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <p className="text-sm text-slate-600">{body}</p>
    <div className="flex gap-3 pt-2">
      <SecondaryButton type="button" onClick={onCancel} disabled={busy} className="flex-1 py-3 rounded-2xl">Cancel</SecondaryButton>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className={`flex-[2] py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-60 ${tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        {busy ? 'Working...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

/**
 * Account management for one user of a hospital, shared by the super admin and hospital admins.
 * `basePath` is the user collection, e.g. `/superadmin/hospitals/:id/users` or `/hospital-admin/staff`.
 * Existing passwords are never shown; resets email a code or issue a one-time temporary password.
 */
const UserAccountPanel = ({ basePath, userId, assignableRoles = [], currentUserId, onClose, onUpdated }) => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setTempPassword('');
    api.get(`${basePath}/${userId}`)
      .then((res) => {
        const u = res.data.data;
        setUser(u);
        setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', role: u.role, department: u.department || '', specialization: u.specialization || '', licenseNumber: u.licenseNumber || '', yearsOfExperience: u.yearsOfExperience ?? '' });
      })
      .catch((err) => { toast.error(errorText(err, 'Could not load this account')); onClose(); })
      .finally(() => setLoading(false));
    // basePath/onClose are stable for the panel's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isSelf = user && String(user._id) === String(currentUserId);
  const roleOptions = [...new Set([...assignableRoles, user?.role].filter(Boolean))].map((r) => ({ value: r, label: ROLE_LABELS[r] || r.replace('_', ' ') }));

  const applyUpdate = (updated, message) => {
    setUser(updated);
    onUpdated?.(updated);
    toast.success(message || 'Saved');
  };

  const save = async (e) => {
    e.preventDefault();
    const changes = {};
    for (const key of ['name', 'email', 'phone', 'department', 'specialization', 'licenseNumber', 'yearsOfExperience']) {
      if (String(form[key] ?? '') !== String(user[key] ?? '')) changes[key] = form[key];
    }
    if (form.role !== user.role) changes.role = form.role;
    if (!Object.keys(changes).length) { toast('No changes to save'); return; }
    if (changes.role || changes.email) {
      setConfirm({
        title: 'Confirm changes',
        body: [
          changes.role && `Change role from ${ROLE_LABELS[user.role] || user.role} to ${ROLE_LABELS[changes.role] || changes.role}? This changes what they can access.`,
          changes.email && `Change the login email to ${changes.email}? They'll need to verify the new address before logging in.`,
        ].filter(Boolean).join(' '),
        confirmLabel: 'Save changes',
        tone: 'primary',
        run: () => submit(changes),
      });
      return;
    }
    submit(changes);
  };

  const submit = async (changes) => {
    setSaving(true);
    try {
      const res = await api.patch(`${basePath}/${userId}`, changes);
      applyUpdate(res.data.data, res.data.message);
    } catch (err) {
      toast.error(errorText(err, 'Could not save changes'));
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const setStatus = (status) => setConfirm({
    title: status === 'active' ? 'Activate account' : 'Deactivate account',
    body: status === 'active'
      ? `${user.name} will be able to log in again.`
      : `${user.name} will no longer be able to log in. Their records are kept and you can reactivate them later.`,
    confirmLabel: status === 'active' ? 'Activate' : 'Deactivate',
    tone: status === 'active' ? 'primary' : 'danger',
    run: async () => {
      setBusy(true);
      try {
        const res = await api.patch(`${basePath}/${userId}`, { status });
        applyUpdate(res.data.data, status === 'active' ? 'Account activated' : 'Account deactivated');
      } catch (err) {
        toast.error(errorText(err, 'Could not change the account status'));
      } finally {
        setBusy(false);
        setConfirm(null);
      }
    },
  });

  const resetPassword = (method) => setConfirm({
    title: method === 'email' ? 'Email a password reset code' : 'Set a temporary password',
    body: method === 'email'
      ? `We'll email ${user.email} a 6-digit code. They finish the reset on the "Forgot your password?" page. Their current password keeps working until then.`
      : `This replaces ${user.name}'s password immediately with a one-time temporary password, shown to you once. They must choose a new password when they next log in.`,
    confirmLabel: method === 'email' ? 'Send reset code' : 'Generate password',
    tone: method === 'email' ? 'primary' : 'danger',
    run: async () => {
      setBusy(true);
      try {
        const res = await api.post(`${basePath}/${userId}/reset-password`, { method });
        if (method === 'temporary') setTempPassword(res.data.data.temporaryPassword);
        toast.success(res.data.data.message);
      } catch (err) {
        toast.error(errorText(err, 'Could not reset the password'));
      } finally {
        setBusy(false);
        setConfirm(null);
      }
    },
  });

  const resendVerification = async () => {
    setBusy(true);
    try {
      const res = await api.post(`${basePath}/${userId}/resend-verification`);
      toast.success(res.data.data.message);
    } catch (err) {
      toast.error(errorText(err, 'Could not send the verification code'));
    } finally {
      setBusy(false);
    }
  };

  const copyTemp = async () => {
    try { await navigator.clipboard.writeText(tempPassword); toast.success('Copied'); } catch { toast.error('Copy failed; select and copy it manually'); }
  };

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <>
      <Modal open={!!userId && !confirm} title={user ? user.name : 'Account'} onClose={onClose}>
        {loading || !user ? <LoadingBlock text="Loading account..." /> : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="blue">{ROLE_LABELS[user.role] || user.role}</StatusBadge>
              <StatusBadge tone={STATUS_TONES[user.status] || 'slate'}>{user.status}</StatusBadge>
              <StatusBadge tone={user.isEmailVerified ? 'green' : 'amber'}>{user.isEmailVerified ? 'Email verified' : 'Email not verified'}</StatusBadge>
              {user.mustChangePassword && <StatusBadge tone="amber">Must change password</StatusBadge>}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <dt>Joined</dt><dd className="text-slate-800 font-semibold">{formatDate(user.createdAt)}</dd>
              <dt>Last login</dt><dd className="text-slate-800 font-semibold">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Not recorded yet'}</dd>
            </dl>

            {tempPassword && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2" role="alert">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-2"><AlertTriangle size={16} /> Temporary password (shown only once)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 font-mono text-sm text-slate-900 select-all break-all">{tempPassword}</code>
                  <SecondaryButton type="button" onClick={copyTemp}><Copy size={14} /> Copy</SecondaryButton>
                </div>
                <p className="text-xs text-amber-800">Share it privately (in person or by phone). It is not stored anywhere you can view it again.</p>
              </div>
            )}

            <form onSubmit={save} className="space-y-4">
              <Field label="Full name"><TextInput name="name" value={form.name} onChange={setField} required /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email"><TextInput name="email" type="email" value={form.email} onChange={setField} required /></Field>
                <Field label="Phone"><TextInput name="phone" type="tel" value={form.phone} onChange={setField} /></Field>
              </div>
              {user.role !== 'patient' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Role">
                    <Select name="role" value={form.role} onChange={setField} options={roleOptions} disabled={isSelf || !assignableRoles.includes(user.role)} />
                  </Field>
                  <Field label="Department"><TextInput name="department" value={form.department} onChange={setField} /></Field>
                </div>
              )}
              {PROFESSIONAL_ROLES.includes(form.role) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Specialization"><TextInput name="specialization" value={form.specialization} onChange={setField} /></Field>
                  <Field label="License no."><TextInput name="licenseNumber" value={form.licenseNumber} onChange={setField} /></Field>
                  <Field label="Years exp."><TextInput name="yearsOfExperience" type="number" min="0" max="70" value={form.yearsOfExperience} onChange={setField} /></Field>
                </div>
              )}
              {isSelf && <p className="text-xs text-slate-500">This is your account. Change your own role, status or password from Settings.</p>}
              {!isSelf && !assignableRoles.includes(user.role) && user.role !== 'patient' && <p className="text-xs text-slate-500">Only the platform administrator can change this account's role or status.</p>}
              <PrimaryButton type="submit" disabled={saving} className="w-full">
                <Save size={16} /> {saving ? 'Saving...' : 'Save changes'}
              </PrimaryButton>
            </form>

            {!isSelf && (
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900">Security</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SecondaryButton type="button" onClick={() => resetPassword('email')} disabled={busy}><Mail size={16} /> Email reset code</SecondaryButton>
                  <SecondaryButton type="button" onClick={() => resetPassword('temporary')} disabled={busy}><KeyRound size={16} /> Temporary password</SecondaryButton>
                  {!user.isEmailVerified && (
                    <SecondaryButton type="button" onClick={resendVerification} disabled={busy}><CheckCircle2 size={16} /> Resend verification</SecondaryButton>
                  )}
                  {(assignableRoles.includes(user.role) || user.role === 'patient') && (
                    user.status === 'active' ? (
                      <SecondaryButton type="button" onClick={() => setStatus('inactive')} disabled={busy} className="text-red-600 border-red-200 hover:bg-red-50"><ShieldOff size={16} /> Deactivate</SecondaryButton>
                    ) : (
                      <SecondaryButton type="button" onClick={() => setStatus('active')} disabled={busy} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"><ShieldCheck size={16} /> Activate</SecondaryButton>
                    )
                  )}
                </div>
                <p className="text-xs text-slate-500">Passwords are never visible to administrators. Every change is recorded in the audit log.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Confirm
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        busy={busy || saving}
        onConfirm={() => confirm?.run()}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default UserAccountPanel;
