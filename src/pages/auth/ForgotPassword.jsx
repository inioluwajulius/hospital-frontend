import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import BrandLogo from '../../component/BrandLogo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await api.forgotPassword({ email });
      setMessage(response.data.message || 'If an account exists for this email, you will receive a password reset link.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-white'>
      {/* Left Column - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-linear-to-br from-blue-600 to-emerald-600 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)]" style={{ backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20 mb-8 inline-block shadow-xl">
            <BrandLogo size='hero' showText={false} />
          </div>
          <h2 className="text-4xl font-extrabold mb-4 text-white tracking-tight">MediCare System</h2>
          <p className="text-blue-100 text-lg font-medium leading-relaxed">
            Secure account recovery to keep your healthcare experience seamless.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className='lg:hidden flex justify-center mb-6'>
            <BrandLogo size='hero' showText={false} />
          </div>

          <div className='text-center mb-10'>
            <h1 className='text-3xl font-extrabold text-slate-900 mb-2 tracking-tight'>Forgot Password</h1>
            <p className='text-sm text-slate-500 font-medium'>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl mb-6"
            >
              <CheckCircle2 className='text-emerald-600 shrink-0 mt-0.5' size={18} />
              <p className='text-sm text-emerald-700 font-medium'>{message}</p>
            </motion.div>
          )}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-6"
            >
              <AlertCircle className='text-red-600 shrink-0 mt-0.5' size={18} />
              <p className='text-sm text-red-700 font-medium'>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label className='block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2'>Email Address</label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none transition-all text-sm font-medium focus:border-primary focus:bg-white'
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !email}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <>
                  <Loader2 size={18} className='animate-spin' />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>

          <div className='text-center mt-8'>
            <Link 
              to="/auth/login/patient" 
              className='inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-semibold transition-colors'
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
