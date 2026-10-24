import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound, RotateCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import AuthSplitLayout from '../../component/AuthSplitLayout';
import OtpInput from '../../component/forms/OtpInput';
import { FormError, FormSuccess, PasswordInput } from '../../component/forms/index.js';
import { isPasswordStrong } from '../../utils/validation/index.js';
import { useCountdown } from '../../hooks/useCountdown';

const RESEND_SECONDS = 60;
const STEPS = ['email', 'code', 'password'];

const errorText = (err, fallback) =>
  err?.response?.data?.message || (err?.response ? fallback : 'Network error. Please check your connection and try again.');

const primaryButton = 'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed';

/** Step indicator: email -> code -> new password */
const StepDots = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-8" aria-hidden="true">
    {STEPS.map((s, i) => (
      <span
        key={s}
        className={`h-1.5 rounded-full transition-all ${i <= STEPS.indexOf(step) ? 'w-8 bg-primary' : 'w-4 bg-slate-200'}`}
      />
    ))}
  </div>
);

/**
 * Password recovery: request a 6-digit code by email, verify it, then set a new password.
 * The reset token returned after the code is verified is kept in memory only.
 */
const ForgotPassword = () => {
  const [params] = useSearchParams();
  const loginPath = params.get('role') === 'doctor' ? '/auth/login/doctor' : '/auth/login/patient';

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, startCooldown] = useCountdown(0);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordStrong = useMemo(() => isPasswordStrong(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const requestCode = async (e) => {
    e?.preventDefault();
    if (!emailValid || loading || cooldown > 0) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await api.forgotPassword({ email: email.trim() });
      // The code step already explains what happened; only confirm repeat requests
      if (step === 'code') setInfo('If this email has an account, a new code is on its way.');
      startCooldown(res.data?.retryAfterSeconds || RESEND_SECONDS);
      setCode('');
      setStep('code');
    } catch (err) {
      setError(errorText(err, 'Could not send a reset code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (value = code) => {
    if (loading || value.length !== 6) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await api.verifyResetCode({ email: email.trim(), code: value });
      setResetToken(res.data.resetToken);
      setStep('password');
    } catch (err) {
      setError(errorText(err, 'The code is incorrect or has expired.'));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    if (!passwordStrong || !passwordsMatch || loading) return;
    setLoading(true);
    setError('');
    try {
      await api.resetPasswordWithCode({ resetToken, password, confirmPassword });
      setResetToken('');
      setPassword('');
      setConfirmPassword('');
      setStep('done');
    } catch (err) {
      const message = errorText(err, 'Could not reset your password. Please try again.');
      setError(message);
      // An expired or used reset session can't be retried; start over from the code step
      if (err?.response?.data?.code === 'INVALID_RESET_SESSION') {
        setResetToken('');
        setStep('code');
      }
    } finally {
      setLoading(false);
    }
  };

  const messages = (
    <div aria-live="polite" className="space-y-3 mb-6 empty:mb-0">
      {error && <FormError error={error} />}
      {info && <FormSuccess message={info} />}
    </div>
  );

  const backToLogin = (
    <div className="text-center mt-8">
      <Link to={loginPath} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-semibold transition-colors">
        <ArrowLeft size={16} />
        Back to Login
      </Link>
    </div>
  );

  if (step === 'done') {
    return (
      <AuthSplitLayout tagline="Secure account recovery to keep your healthcare experience seamless.">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-500" size={44} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Password reset</h1>
            <p className="text-sm text-slate-500 font-medium">
              Your password has been changed. Log in with your new password. We've also emailed you a confirmation.
            </p>
          </div>
          <Link to={loginPath} className={primaryButton}>Back to Login</Link>
        </motion.div>
      </AuthSplitLayout>
    );
  }

  if (step === 'password') {
    return (
      <AuthSplitLayout tagline="Secure account recovery to keep your healthcare experience seamless." title="Choose a new password" subtitle="Use a strong password you haven't used before.">
        <StepDots step={step} />
        {messages}
        <form onSubmit={resetPassword} className="space-y-5" noValidate>
          <PasswordInput
            label="New Password"
            name="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            touched={touched.password}
            error={touched.password && password && !passwordStrong ? 'Use 8+ characters with upper and lower case letters, a number and a symbol' : null}
            showStrength={true}
            required
          />
          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
            touched={touched.confirmPassword || confirmPassword.length > 0}
            error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : null}
            showStrength={false}
            required
          />
          <button type="submit" disabled={loading || !passwordStrong || !passwordsMatch} className={primaryButton}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><ShieldCheck size={18} /> Reset Password</>}
          </button>
        </form>
        {backToLogin}
      </AuthSplitLayout>
    );
  }

  if (step === 'code') {
    return (
      <AuthSplitLayout tagline="Secure account recovery to keep your healthcare experience seamless." title="Enter your reset code">
        <StepDots step={step} />
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
            <KeyRound size={28} />
          </div>
          <p className="text-sm text-slate-500 font-medium">
            If <span className="font-bold text-slate-900 break-all">{email.trim()}</span> has an account, we've sent it a 6-digit code. It expires in 10 minutes.
          </p>
        </div>
        {messages}
        <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }} className="space-y-6">
          <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} onComplete={verifyCode} disabled={loading} error={!!error} label="Password reset code" />
          <button type="submit" disabled={loading || code.length !== 6} className={primaryButton}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Code'}
          </button>
        </form>
        <div className="text-center mt-6 text-sm text-slate-500 font-medium space-y-2">
          <div>
            Didn't get a code?{' '}
            {cooldown > 0 ? (
              <span className="text-slate-400">Resend in {cooldown}s</span>
            ) : (
              <button type="button" onClick={requestCode} disabled={loading} className="inline-flex items-center gap-1 text-primary font-bold hover:underline disabled:opacity-50">
                <RotateCw size={14} /> Resend code
              </button>
            )}
          </div>
          <button type="button" onClick={() => { setStep('email'); setError(''); setInfo(''); }} className="text-slate-500 hover:text-primary font-semibold">
            Use a different email
          </button>
        </div>
        {backToLogin}
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout tagline="Secure account recovery to keep your healthcare experience seamless." title="Forgot Password" subtitle="Enter your email and we'll send you a 6-digit reset code.">
      <StepDots step={step} />
      {messages}
      <form onSubmit={requestCode} className="space-y-5" noValidate>
        <div>
          <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="forgot-email"
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={touched.email && email && !emailValid ? true : undefined}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none transition-all text-sm font-medium focus:border-primary focus:bg-white"
            />
          </div>
          {touched.email && email && !emailValid && (
            <p className="text-xs text-red-600 font-medium mt-2">Please enter a valid email address</p>
          )}
        </div>
        <button type="submit" disabled={loading || !emailValid || cooldown > 0} className={primaryButton}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : cooldown > 0 ? `Send again in ${cooldown}s` : 'Send Reset Code'}
        </button>
      </form>
      {backToLogin}
    </AuthSplitLayout>
  );
};

export default ForgotPassword;
