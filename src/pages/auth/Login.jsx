import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { loginUser } from '../../services/api';
import BrandLogo from '../../component/BrandLogo';
import { cn } from '../../lib/utils';

const Login = () => {
  const { role } = useParams(); // Extract role from URL
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const isPatient = role === 'patient';
  const isDoctor = role === 'doctor';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = validateEmail(formData.email) && formData.password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginUser(formData);
      localStorage.setItem('token', response.data.token);
      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect based on user role (normalize to lowercase for comparison)
      let redirectPath = '/auth/login/patient'; // default fallback
      const userRole = user?.role?.toLowerCase() || '';
      if (userRole === 'admin' || userRole === 'hospital_admin' || userRole === 'super_admin') {
        redirectPath = '/admin/doctors';
      } else if (userRole === 'doctor') {
        redirectPath = '/doctor/dashboard';
      } else if (userRole === 'patient') {
        redirectPath = '/patient/billing';
      }
      
      window.location.href = redirectPath;
    } catch (err) {
      setError(err?.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-slate-50 to-indigo-100 px-4'>
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-8 md:p-12 shadow-2xl rounded-3xl w-full max-w-md border border-slate-100'
      >
        <div className='text-center mb-12'>
          <Motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className='flex justify-center mb-6'
          >
            <BrandLogo size='hero' showText={false} />
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className='text-3xl font-extrabold text-slate-900 mb-2 tracking-tight'>
              {isPatient ? 'Patient Login' : isDoctor ? 'Doctor Login' : 'Welcome Back'}
            </h1>
            <p className='text-sm text-slate-500 font-medium'>
              {isPatient ? 'Access your medical records' : isDoctor ? 'Access the dashboard' : 'Login to MediCare Hospital System'}
            </p>
          </Motion.div>
        </div>
        
        <form onSubmit={handleSubmit} className='space-y-6'>
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <label className='block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2'>Email Address</label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={18} />
              <input 
                type="email" 
                name="email"
                placeholder={isPatient ? 'patient@email.com' : 'doctor@hospital.com'}
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className={cn(
                  'w-full pl-10 pr-4 py-3 bg-slate-50 border-2 rounded-xl outline-none transition-all text-sm font-medium',
                  touched.email && !validateEmail(formData.email) 
                    ? 'border-red-300 focus:border-red-500 focus:bg-red-50/50' 
                    : 'border-slate-200 focus:border-primary focus:bg-white'
                )}
              />
            </div>
            {touched.email && formData.email && !validateEmail(formData.email) && (
              <p className='text-xs text-red-600 mt-1 font-medium'>Please enter a valid email address</p>
            )}
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <label className='block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2'>Password</label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder='Enter your password'
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                className={cn(
                  'w-full pl-10 pr-12 py-3 bg-slate-50 border-2 rounded-xl outline-none transition-all text-sm font-medium',
                  touched.password && formData.password.length > 0 && formData.password.length < 6
                    ? 'border-red-300 focus:border-red-500 focus:bg-red-50/50' 
                    : 'border-slate-200 focus:border-primary focus:bg-white'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Motion.div>

          {error && (
            <Motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='flex gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl'
            >
              <AlertCircle className='text-red-600 shrink-0 mt-0.5' size={18} />
              <p className='text-sm text-red-700 font-medium'>{error}</p>
            </Motion.div>
          )}

          <Motion.button 
            type='submit'
            disabled={!isFormValid || isLoading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            whileHover={{ scale: isFormValid ? 1.02 : 1 }}
            whileTap={{ scale: isFormValid ? 0.98 : 1 }}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
              isFormValid 
                ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-lg hover:shadow-primary/40' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className='animate-spin' />
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Login to Dashboard
              </>
            )}
          </Motion.button>
        </form>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className='text-center text-sm text-slate-600 mt-8'
        >
          Don't have an account?{' '}
          <a 
            href={isPatient ? '/auth/register/patient' : isDoctor ? '/auth/register/doctor' : '/auth/register'} 
            className='text-primary font-bold hover:underline'
          >
            Register here
          </a>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className='text-center text-xs text-slate-400 mt-6 pt-6 border-t border-slate-100'
        >
          This is a secure healthcare system. All access is logged and monitored.
        </Motion.div>
      </Motion.div>
    </div>
  );
};

export default Login;
