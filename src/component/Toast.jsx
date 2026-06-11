import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const toastVariants = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-900',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
  },
};

export const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variant = toastVariants[type] || toastVariants.info;
  const Icon = variant.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${variant.bgColor} border ${variant.borderColor} rounded-lg p-4 flex items-center gap-3 shadow-lg max-w-md`}
    >
      <Icon size={20} className={variant.iconColor} />
      <p className={`text-sm font-medium ${variant.textColor} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`p-1 hover:bg-black/5 rounded transition-colors`}
      >
        <X size={16} className={variant.iconColor} />
      </button>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  </div>
);
