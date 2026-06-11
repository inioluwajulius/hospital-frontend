import React from 'react';
import { motion } from 'framer-motion';

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel,
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'py-8',
    medium: 'py-16',
    large: 'py-24'
  };

  const iconSize = {
    small: 48,
    medium: 64,
    large: 96
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center ${sizeClasses[size]} text-center`}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-4 p-3 bg-slate-100 rounded-full"
        >
          <Icon size={iconSize[size]} className="text-slate-400" />
        </motion.div>
      )}
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      )}
      {action && actionLabel && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action}
          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};
