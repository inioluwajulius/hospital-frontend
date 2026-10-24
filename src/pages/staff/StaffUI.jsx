import React from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Shared building blocks for the staff portal pages, styled like the rest of the app

export const PageHeader = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100"
  >
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
        {Icon && (
          <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
            <Icon size={28} />
          </div>
        )}
        {title}
      </h1>
      {description && <p className="text-slate-500 font-medium">{description}</p>}
    </div>
    {action}
  </motion.div>
);

export const PrimaryButton = ({ children, className, ...props }) => (
  <button
    {...props}
    className={cn(
      'bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
      className
    )}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, className, ...props }) => (
  <button
    {...props}
    className={cn(
      'bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-60',
      className
    )}
  >
    {children}
  </button>
);

export const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative w-full md:w-96">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    <input
      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const Panel = ({ children, className }) => (
  <section className={cn('bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden', className)}>
    {children}
  </section>
);

const STATUS_STYLES = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
};

export const StatusBadge = ({ tone = 'slate', children }) => (
  <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap', STATUS_STYLES[tone])}>
    {children}
  </span>
);

export const Field = ({ label, children }) => (
  <label className="block space-y-2">
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all';

export const TextInput = (props) => <input {...props} className={cn(inputClass, props.className)} />;

export const TextArea = (props) => <textarea rows={3} {...props} className={cn(inputClass, props.className)} />;

export const Select = ({ options, placeholder, ...props }) => (
  <select {...props} className={cn(inputClass, props.className)}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

export const Modal = ({ open, title, onClose, children, footer }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">{children}</div>
          {footer && <div className="p-6 pt-0 flex gap-3">{footer}</div>}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const SubmitRow = ({ onCancel, submitting, label }) => (
  <>
    <SecondaryButton type="button" onClick={onCancel} disabled={submitting} className="flex-1 py-3.5 rounded-2xl">
      Cancel
    </SecondaryButton>
    <PrimaryButton type="submit" disabled={submitting} className="flex-[2]">
      {submitting && <Loader2 size={18} className="animate-spin" />}
      {label}
    </PrimaryButton>
  </>
);

export const LoadingBlock = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
    <p className="text-sm text-slate-500 font-medium">{text}</p>
  </div>
);

export const EmptyRow = ({ children }) => (
  <div className="p-10 text-center text-sm text-slate-500 font-medium">{children}</div>
);
