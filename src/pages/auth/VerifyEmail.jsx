import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import BrandLogo from '../../component/BrandLogo';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.verifyEmail(token);
        setMessage(response.data.message || 'Email successfully verified! Your account is now active.');
      } catch (err) {
        setError(err.response?.data?.message || 'Error verifying email or token expired.');
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [token]);

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
            Securing your account and verifying your identity.
          </p>
        </div>
      </div>

      {/* Right Column - Content */}
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
            <h1 className='text-3xl font-extrabold text-slate-900 mb-2 tracking-tight'>Email Verification</h1>
            <p className='text-sm text-slate-500 font-medium'>
              {verifying ? 'Please wait while we verify your email address...' : 'Verification complete.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            {verifying ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-600 font-medium">Verifying token...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {message && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Successfully</h3>
                    <p className="text-sm text-slate-500 mb-6">{message}</p>
                    <Link 
                      to="/auth/login/patient" 
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 hover:shadow-primary/40"
                    >
                      Continue to Login
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                )}
                
                {error && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h3>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                    <div className="space-y-3 w-full">
                      <Link 
                        to="/auth/login/patient" 
                        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        Back to Login
                      </Link>
                      <Link 
                        to="/auth/forgot-password" 
                        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Resend Verification Email
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
