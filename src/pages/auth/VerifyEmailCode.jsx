import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, MailCheck, CheckCircle2, ArrowLeft, RotateCw } from 'lucide-react';
import { api } from '../../services/api';
import AuthSplitLayout from '../../component/AuthSplitLayout';
import OtpInput from '../../component/forms/OtpInput';
import { FormError, FormSuccess } from '../../component/forms/index.js';
import { useCountdown } from '../../hooks/useCountdown';

const RESEND_SECONDS = 60;

// "Check your connection" only when no response arrived. If the server answered but its
// message can't be read, fall back to a message based on the status code.
const describeError = (err, fallback) => {
  if (!err?.response) return "We couldn't reach the server. Check your connection and try again.";
  const message = err.response.data?.message;
  if (typeof message === 'string' && message) return message;
  if (err.response.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (err.response.status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return fallback;
};

/**
 * /auth/verify-email?email=...&role=patient|doctor[&send=1]
 * Enter the 6-digit code emailed at registration. `send=1` requests a fresh code on
 * arrival (used when login reports an unverified email).
 */
const VerifyEmailCode = () => {
  const [params] = useSearchParams();
  const role = params.get('role') === 'doctor' ? 'doctor' : 'patient';
  const loginPath = `/auth/login/${role}`;

  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  // Arriving with an email means a code was just sent (or is about to be), so start on cooldown
  const [cooldown, startCooldown] = useCountdown(params.get('email') ? RESEND_SECONDS : 0);
  const sentOnArrival = useRef(false);

  const resend = async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    setError('');
    setInfo('');
    try {
      const res = await api.resendVerificationCode({ email });
      setInfo('If this email still needs verification, a new code is on its way. Check your inbox and spam folder.');
      startCooldown(res.data?.retryAfterSeconds || RESEND_SECONDS);
      setCode('');
    } catch (err) {
      setError(describeError(err, 'Could not send a new code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (params.get('send') === '1' && email && !sentOnArrival.current) {
      sentOnArrival.current = true;
      api.resendVerificationCode({ email })
        .then((res) => startCooldown(res.data?.retryAfterSeconds || RESEND_SECONDS))
        .catch(() => startCooldown(0));
    }
  }, [params, email, startCooldown]);

  const submit = async (value = code) => {
    if (submitting || value.length !== 6 || !email) return;
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      await api.verifyEmailCode({ email, code: value });
      setVerified(true);
    } catch (err) {
      setError(describeError(err, 'That code is incorrect or has expired. Use the code from the most recent email, or request a new one.'));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  if (verified) {
    return (
      <AuthSplitLayout tagline="Securing your account and verifying your identity.">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-500" size={44} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Email verified</h1>
            <p className="text-sm text-slate-500 font-medium">Your email address is confirmed. You can now log in to your account.</p>
          </div>
          <Link
            to={loginPath}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
          >
            Continue to login
          </Link>
        </motion.div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      tagline="Securing your account and verifying your identity."
      title="Verify your email"
      subtitle={email ? undefined : 'Enter your email and the 6-digit code we sent you.'}
    >
      {email && (
        <div className="flex flex-col items-center text-center mb-8 -mt-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
            <MailCheck size={28} />
          </div>
          <p className="text-sm text-slate-500 font-medium">
            We sent a 6-digit code to <span className="font-bold text-slate-900 break-all">{email}</span>. It expires in 10 minutes. If you received more than one, use the latest.
          </p>
        </div>
      )}

      <div aria-live="polite" className="space-y-3 mb-6">
        {error && <FormError error={error} />}
        {info && <FormSuccess message={info} />}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
        {!params.get('email') && (
          <div>
            <label htmlFor="verify-email" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Email Address</label>
            <input
              id="verify-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none transition-all text-sm font-medium focus:border-primary focus:bg-white"
            />
          </div>
        )}

        <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} onComplete={submit} disabled={submitting} error={!!error} autoFocus={!!params.get('email')} />

        <button
          type="submit"
          disabled={submitting || code.length !== 6 || !email}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Email'}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-slate-500 font-medium">
        Didn't get a code?{' '}
        {cooldown > 0 ? (
          <span className="text-slate-400">Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} disabled={resending || !email} className="inline-flex items-center gap-1 text-primary font-bold hover:underline disabled:opacity-50">
            {resending ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            Resend code
          </button>
        )}
      </div>

      <div className="text-center mt-8">
        <Link to={loginPath} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-semibold transition-colors">
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </AuthSplitLayout>
  );
};

export default VerifyEmailCode;
