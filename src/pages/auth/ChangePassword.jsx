import React, { useMemo, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import AuthSplitLayout from '../../component/AuthSplitLayout';
import { PasswordInput, FormError } from '../../component/forms/index.js';
import { isPasswordStrong } from '../../utils/validation/index.js';
import { logout } from '../../services/session';
import { STAFF_ROLES } from '../staff/staffUtils';

const homeFor = (role) => {
  if (role === 'super_admin') return '/superadmin/dashboard';
  if (role === 'hospital_admin' || role === 'admin') return '/admin/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'patient') return '/patient/dashboard';
  if (STAFF_ROLES.includes(role)) return '/staff/dashboard';
  return '/';
};

/**
 * /account/change-password  shown after logging in with an admin-issued temporary
 * password: the account can't be used until a new password is chosen.
 */
const ChangePassword = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const strong = useMemo(() => isPasswordStrong(next), [next]);

  const submit = async (e) => {
    e.preventDefault();
    if (!strong || next !== confirm) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      localStorage.setItem('token', res.data.token);
      let role = '';
      try { role = JSON.parse(localStorage.getItem('user') || '{}').role; } catch { /* ignore */ }
      window.location.href = homeFor(role);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not change your password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout tagline="Keeping your account secure." title="Choose a new password" subtitle="Your administrator gave you a temporary password. Set your own to continue.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <FormError error={error} />}
        <PasswordInput label="Temporary password" name="currentPassword" value={current} onChange={(e) => setCurrent(e.target.value)} showStrength={false} required />
        <PasswordInput label="New password" name="newPassword" value={next} onChange={(e) => setNext(e.target.value)} showStrength required />
        <PasswordInput label="Confirm new password" name="confirmPassword" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          touched={confirm.length > 0} error={confirm && confirm !== next ? 'Passwords do not match' : null} showStrength={false} required />
        <button type="submit" disabled={busy || !current || !strong || next !== confirm}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />} Set new password
        </button>
        <button type="button" onClick={logout} className="w-full text-sm text-slate-500 hover:text-primary font-semibold">Log out instead</button>
      </form>
    </AuthSplitLayout>
  );
};

export default ChangePassword;
