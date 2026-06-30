import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';
import BrandLogo from '../component/BrandLogo';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-slate-50 to-emerald-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <div className="flex justify-center mb-8">
          <BrandLogo size='lg' showText={false} />
        </div>

        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-8xl font-black text-slate-200 mb-4 select-none"
        >
          404
        </motion.div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-all text-sm shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/register')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/20"
          >
            <Home size={18} />
            Back to Home
          </motion.button>
        </div>

        <p className="text-xs text-slate-400 mt-12 font-medium">
          MediCare Hospital Management System
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
