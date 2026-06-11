import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Reusable form text input component
 * Handles validation display, error messages, and UI state
 */
export const FormInput = React.forwardRef((
    {
        label,
        name,
        type = 'text',
        placeholder,
        value,
        onChange,
        onBlur,
        error,
        touched,
        disabled = false,
        required = false,
        helpText,
        icon: Icon,
        autoComplete,
        inputClassName,
    },
    ref,
) => {
    const isInvalid = touched && error;
    const isValid = touched && !error;

    return (
        <div className="space-y-2">
            {label && (
                <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    name={name}
                    id={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className={cn(
                        'w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl',
                        'transition-all duration-200 focus:outline-none',
                        'placeholder:text-slate-400 text-slate-900',
                        Icon && 'pl-12',
                        isInvalid && 'border-red-500 bg-red-50 focus:border-red-600 focus:bg-white',
                        isValid && 'border-emerald-500 bg-emerald-50 focus:border-emerald-600',
                        !isInvalid && !isValid && 'focus:border-primary focus:bg-white',
                        disabled && 'opacity-50 cursor-not-allowed',
                        inputClassName,
                    )}
                />

                {isValid && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckCircle2 size={18} />
                    </div>
                )}
                {isInvalid && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertCircle size={18} />
                    </div>
                )}
            </div>

            {error && touched && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle size={14} />
                    {error}
                </p>
            )}

            {helpText && !error && (
                <p className="text-xs text-slate-500">{helpText}</p>
            )}
        </div>
    );
});

FormInput.displayName = 'FormInput';

export default FormInput;
