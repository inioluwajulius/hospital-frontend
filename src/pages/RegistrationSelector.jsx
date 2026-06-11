import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import BrandLogo from '../component/BrandLogo';

const RegistrationSelector = () => {
  const navigate = useNavigate();

  const registrationOptions = [
    {
      id: 'patient',
      title: 'Patient Registration',
      description: 'Register as a patient to access your medical records, prescriptions, and appointments',
      icon: User,
      path: '/auth/register/patient',
      color: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'doctor',
      title: 'Doctor Registration',
      description: 'Register as a doctor to manage patient appointments, records, and consultations',
      icon: Stethoscope,
      path: '/auth/register/doctor',
      color: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600'
    }
  ];

  return (
    <div className='flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-slate-50 to-indigo-100 px-4'>
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-4xl'
      >
        {/* Header */}
        <div className='text-center mb-12'>
          <Motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className='flex justify-center mb-6'
          >
            <BrandLogo size='hero' showText={false} />
          </Motion.div>
          <Motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className='text-4xl font-extrabold text-slate-900 mb-3 tracking-tight'
          >
            Welcome to MediCare
          </Motion.h1>
          <Motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className='text-lg text-slate-600 font-medium'
          >
            Choose your registration type to get started
          </Motion.p>
        </div>

        {/* Registration Options */}
        <div className='grid md:grid-cols-2 gap-6 mb-8'>
          {registrationOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Motion.button
                key={option.id}
                onClick={() => navigate(option.path)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative overflow-hidden border-2 ${option.borderColor} rounded-2xl p-8 text-left transition-all ${option.lightBg} hover:shadow-xl`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${option.color} transition-opacity`} />
                
                {/* Content */}
                <div className='relative z-10'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className={`p-3 rounded-xl ${option.lightBg}`}>
                      <IconComponent className={`${option.textColor}`} size={28} />
                    </div>
                    <ArrowRight className={`${option.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} size={20} />
                  </div>
                  
                  <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                    {option.title}
                  </h2>
                  <p className='text-slate-600 text-sm leading-relaxed'>
                    {option.description}
                  </p>
                </div>
              </Motion.button>
            );
          })}
        </div>

        {/* Already registered link */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className='text-center text-slate-600'
        >
          Already have an account?{' '}
          <button
            onClick={() => navigate('/auth/login/patient')}
            className='text-primary font-bold hover:underline cursor-pointer'
          >
            Login here
          </button>
        </Motion.div>

        {/* Security notice */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className='text-center text-xs text-slate-400 mt-8 pt-6 border-t border-slate-100'
        >
          This is a secure healthcare system. All access is logged and monitored.
        </Motion.div>
      </Motion.div>
    </div>
  );
};

export default RegistrationSelector;
