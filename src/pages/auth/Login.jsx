import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { loginUser } from '../../services/api';
import BrandLogo from '../../component/BrandLogo';
import { cn } from '../../lib/utils';

const Login = () => {
  const { role } = useParams();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [workspaces, setWorkspaces] = useState(null);

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

  const handleLoginSuccess = (response) => {
    localStorage.setItem('token', response.data.token);
    const user = response.data.user;
    localStorage.setItem('user', JSON.stringify(user));
    
    let redirectPath = '/register';
    const userRole = user?.role?.toLowerCase() || '';
    if (userRole === 'admin' || userRole === 'hospital_admin' || userRole === 'super_admin') {
      redirectPath = '/admin/dashboard';
    } else if (userRole === 'doctor') {
      redirectPath = '/doctor/dashboard';
    } else if (userRole === 'patient') {
      redirectPath = '/patient/dashboard';
    }
    
    window.location.href = redirectPath;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginUser(formData);
      handleLoginSuccess(response);
    } catch (err) {
      if (err?.response?.status === 300 && err?.response?.data?.workspaces) {
        setWorkspaces(err.response.data.workspaces);
      } else {
        setError(err?.response?.data?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSelect = async (hospitalId) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await loginUser({ ...formData, hospitalId });
      handleLoginSuccess(response);
    } catch (err) {
      setError(err?.response?.data?.message || 'Authentication failed for selected workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormContent = () => {
    if (workspaces) {
      return (
        <Motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='w-full max-w-md'
        >
          <div className='text-center mb-8'>
            <div className='lg:hidden flex justify-center mb-6'>
              <BrandLogo size='hero' showText={false} />
            </div>
            <h1 className='text-3xl font-extrabold text-slate-900 mb-2 tracking-tight'>Select Your Hospital</h1>
            <p className='text-sm text-slate-500 font-medium'>You belong to multiple hospitals. Please select one to continue.</p>
          </div>
          
          {error && (
            <div className='flex gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-6'>
              <AlertCircle className='text-red-600 shrink-0 mt-0.5' size={18} />
              <p className='text-sm text-red-700 font-medium'>{error}</p>
            </div>
          )}

          <div className='space-y-3'>
            {workspaces.map((ws, i) => (
              <Motion.button
                key={ws.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleWorkspaceSelect(ws.id)}
                disabled={isLoading}
                className='w-full p-4 text-left border-2 border-slate-200 hover:border-primary rounded-xl transition-all flex items-center justify-between group bg-slate-50 hover:bg-white'
              >
                <div>
                  <h3 className='font-bold text-slate-800 group-hover:text-primary transition-colors'>{ws.name}</h3>
                  <p className='text-xs text-slate-500 capitalize'>{ws.role.replace('_', ' ')}</p>
                </div>
                <div className='w-8 h-8 rounded-full bg-white border border-slate-200 group-hover:border-primary/30 group-hover:bg-primary/10 flex items-center justify-center transition-colors'>
                  {isLoading ? <Loader2 size={14} className='text-slate-400 animate-spin' /> : <LogIn size={14} className='text-slate-400 group-hover:text-primary' />}
                </div>
              </Motion.button>
            ))}
          </div>
          
          <button 
            onClick={() => { setWorkspaces(null); setError(''); }}
            className='w-full mt-8 py-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors'
          >
            Back to Login
          </button>
        </Motion.div>
      );
    }

    return (
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='w-full max-w-md'
      >
        <div className='text-center mb-10'>
          <div className='lg:hidden flex justify-center mb-6'>
            <BrandLogo size='hero' showText={false} />
          </div>
          <h1 className='text-3xl font-extrabold text-slate-900 mb-2 tracking-tight'>
            {isPatient ? 'Patient Login' : isDoctor ? 'Doctor Login' : 'Welcome Back'}
          </h1>
          <p className='text-sm text-slate-500 font-medium'>
            {isPatient ? 'Access your medical records' : isDoctor ? 'Access the dashboard' : 'Login to MediCare Hospital System'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
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
          </div>

          <div>
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
          </div>

          {error && (
            <div className='flex gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl'>
              <AlertCircle className='text-red-600 shrink-0 mt-0.5' size={18} />
              <p className='text-sm text-red-700 font-medium'>{error}</p>
            </div>
          )}

          <div className='flex justify-end'>
            <a 
              href='/auth/forgot-password' 
              className='text-xs text-slate-500 hover:text-primary font-semibold transition-colors'
            >
              Forgot your password?
            </a>
          </div>

          <Motion.button 
            type='submit'
            disabled={!isFormValid || isLoading}
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

        <div className='text-center text-sm text-slate-600 mt-8'>
          Don't have an account?{' '}
          <a 
            href={isPatient ? '/auth/register/patient' : isDoctor ? '/auth/register/doctor' : '/register'} 
            className='text-primary font-bold hover:underline'
          >
            Register here
          </a>
        </div>
      </Motion.div>
    );
  };

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-white'>
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-linear-to-br from-blue-600 to-emerald-600 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)]" style={{ backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
           <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20 mb-8 inline-block shadow-xl">
               <BrandLogo size='hero' showText={false} className="text-white" />
           </div>
           <h2 className="text-4xl font-extrabold mb-4 text-white tracking-tight">MediCare System</h2>
           <p className="text-blue-100 text-lg font-medium leading-relaxed">
             A unified, modern healthcare platform connecting patients and medical professionals seamlessly.
           </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        {renderFormContent()}
      </div>
    </div>
  );
};

export default Login;
