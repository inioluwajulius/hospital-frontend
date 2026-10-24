import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, Mail, Globe, Building2, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { WORLD_CURRENCIES } from '../constants/currencies';
import { api } from '../services/api';
import { PasswordInput } from './forms/index.js';
import { isPasswordStrong } from '../utils/validation/index.js';
import { Field, TextInput, TextArea } from '../pages/staff/StaffUI';
import { errorText } from '../pages/staff/staffUtils';

const Section = ({ icon: Icon, title, description, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-100 flex items-start gap-3">
      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><Icon size={18} /></div>
      <div>
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const SaveButton = ({ busy, children = 'Save', ...props }) => (
  <button type="submit" disabled={busy} {...props}
    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-60">
    {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {children}
  </button>
);

const storedUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

/** /admin/settings  account, security, email, hospital profile and preferences */
export const Settings = () => {
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const [user, setUser] = useState(storedUser);
  const role = user?.role;
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [hospital, setHospital] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.getMe().then((res) => {
      setProfile({ name: res.data.name || '', phone: res.data.phone || '' });
      setUser((u) => ({ ...u, email: res.data.email, isEmailVerified: res.data.isEmailVerified }));
    }).catch(() => {});
    if (role === 'hospital_admin') {
      api.get('/hospital-admin/profile').then((res) => {
        const h = res.data.data;
        setHospital({
          name: h.name, description: h.description || '',
          contact: { email: h.contact?.email || '', phone: h.contact?.phone || '', website: h.contact?.website || '' },
          address: { street: h.address?.street || '', city: h.address?.city || '', state: h.address?.state || '', country: h.address?.country || '' },
        });
      }).catch((err) => toast.error(errorText(err, 'Could not load the hospital profile')));
    }
  }, [role]);

  const pwStrong = useMemo(() => isPasswordStrong(pw.newPassword), [pw.newPassword]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy('profile');
    try {
      const res = await api.put('/auth/me', profile);
      const next = { ...storedUser(), name: res.data.data.name };
      localStorage.setItem('user', JSON.stringify(next));
      setUser((u) => ({ ...u, name: res.data.data.name }));
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errorText(err, 'Could not save your profile'));
    } finally { setBusy(''); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwStrong) { toast.error('Choose a stronger new password'); return; }
    if (pw.newPassword !== pw.confirm) { toast.error('New passwords do not match'); return; }
    setBusy('password');
    try {
      const res = await api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed. A confirmation email has been sent.');
    } catch (err) {
      toast.error(errorText(err, 'Could not change your password'));
    } finally { setBusy(''); }
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    setBusy('email');
    try {
      const res = await api.post('/auth/change-email', emailForm);
      toast.success(res.data.message);
      // The new address must be verified before the next login
      const query = new URLSearchParams({ email: res.data.email, role: 'doctor' });
      navigate(`/auth/verify-email?${query}`);
    } catch (err) {
      toast.error(errorText(err, 'Could not change your email'));
    } finally { setBusy(''); }
  };

  const saveHospital = async (e) => {
    e.preventDefault();
    setBusy('hospital');
    try {
      await api.put('/hospital-admin/profile', { description: hospital.description, contact: hospital.contact, address: hospital.address });
      toast.success('Hospital profile saved');
    } catch (err) {
      toast.error(errorText(err, 'Could not save the hospital profile'));
    } finally { setBusy(''); }
  };

  const setNested = (group, key) => (e) => setHospital((h) => ({ ...h, [group]: { ...h[group], [key]: e.target.value } }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account{role === 'hospital_admin' ? ', your hospital profile' : ''} and preferences.</p>
      </div>

      <Section icon={UserIcon} title="My account" description={`${user?.email || ''}${user?.isEmailVerified === false ? ' · email not verified' : ''}`}>
        <form onSubmit={saveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Field label="Full name"><TextInput value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></Field>
          <Field label="Phone"><TextInput type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
          <div><SaveButton busy={busy === 'profile'}>Save profile</SaveButton></div>
        </form>
      </Section>

      <Section icon={Lock} title="Password" description="You'll need your current password. Forgot it? Log out and use “Forgot your password?”.">
        <form onSubmit={changePassword} className="space-y-4" noValidate>
          <PasswordInput label="Current password" name="currentPassword" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} showStrength={false} required />
          <PasswordInput label="New password" name="newPassword" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} showStrength required />
          <PasswordInput label="Confirm new password" name="confirmPassword" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            touched={pw.confirm.length > 0} error={pw.confirm && pw.confirm !== pw.newPassword ? 'Passwords do not match' : null} showStrength={false} required />
          <SaveButton busy={busy === 'password'} disabled={busy === 'password' || !pw.currentPassword || !pwStrong || pw.newPassword !== pw.confirm}>Change password</SaveButton>
        </form>
      </Section>

      <Section icon={Mail} title="Email address" description="We'll send a code to the new address; you'll verify it before your next login.">
        <form onSubmit={changeEmail} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Field label="New email"><TextInput type="email" value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} required /></Field>
          <PasswordInput label="Current password" name="emailPassword" value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} showStrength={false} required />
          <div><SaveButton busy={busy === 'email'} disabled={busy === 'email' || !emailForm.newEmail || !emailForm.password}>Change email</SaveButton></div>
        </form>
      </Section>

      {role === 'hospital_admin' && hospital && (
        <Section icon={Building2} title="Hospital profile" description={`${hospital.name}. To change the hospital's registered name, contact the platform administrator.`}>
          <form onSubmit={saveHospital} className="space-y-4">
            <Field label="Description"><TextArea value={hospital.description} onChange={(e) => setHospital({ ...hospital, description: e.target.value })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Contact email"><TextInput type="email" value={hospital.contact.email} onChange={setNested('contact', 'email')} /></Field>
              <Field label="Contact phone"><TextInput type="tel" value={hospital.contact.phone} onChange={setNested('contact', 'phone')} /></Field>
              <Field label="Website"><TextInput value={hospital.contact.website} onChange={setNested('contact', 'website')} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Street"><TextInput value={hospital.address.street} onChange={setNested('address', 'street')} /></Field>
              <Field label="City"><TextInput value={hospital.address.city} onChange={setNested('address', 'city')} /></Field>
              <Field label="State"><TextInput value={hospital.address.state} onChange={setNested('address', 'state')} /></Field>
              <Field label="Country"><TextInput value={hospital.address.country} onChange={setNested('address', 'country')} /></Field>
            </div>
            <SaveButton busy={busy === 'hospital'}>Save hospital profile</SaveButton>
          </form>
        </Section>
      )}

      <Section icon={Globe} title="Preferences">
        <label className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <span>
            <span className="block font-bold text-slate-900 text-sm">Currency</span>
            <span className="block text-xs text-slate-500">Used for invoices and prices</span>
          </span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 p-2 font-medium shadow-sm outline-none"
          >
            {WORLD_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
            ))}
          </select>
        </label>
      </Section>
    </div>
  );
};

export default Settings;
