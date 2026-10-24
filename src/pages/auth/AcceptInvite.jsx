import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import BrandLogo from '../../component/BrandLogo';
import { PasswordInput, FormError } from '../../component/forms/index.js';
import { isPasswordStrong } from '../../utils/validation/index.js';

// Landing page for the link in a staff invitation email: set a password to activate the account
const AcceptInvite = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strong = useMemo(() => isPasswordStrong(password), [password]);
  const canSubmit = strong && password === confirm && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError('');
      await api.acceptInvitation(token, { password });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Could not accept the invitation. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandLogo size="hero" showText={false} />
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
            <h1 className="text-2xl font-extrabold text-slate-900">You're all set</h1>
            <p className="text-sm text-slate-500">Your account is active. Log in with your email and new password.</p>
            <Link to="/auth/login/doctor" className="inline-block bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm">
              Go to staff login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Accept your invitation</h1>
              <p className="text-sm text-slate-500">Choose a password to activate your staff account.</p>
            </div>

            {error && <FormError error={error} />}

            <PasswordInput
              label="New password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showStrength={true}
              required
            />
            <PasswordInput
              label="Confirm password"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              touched={confirm.length > 0}
              error={confirm && confirm !== password ? 'Passwords do not match' : null}
              required
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              Activate account
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
