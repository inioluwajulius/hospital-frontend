import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPasswordStrength } from '../../utils/validation/password.js';
import { cn } from '../../lib/utils';
import PasswordStrengthMeter from './PasswordStrengthMeter.jsx';

/**
 * Reusable password input component with strength indicator
 * Shows real-time password strength feedback
 */
export const PasswordInput = React.forwardRef((
    {
        label,
        name,
        placeholder,
        value,
        onChange,
        onBlur,
        error,
        touched,
        disabled = false,
        required = false,
        showStrength = true,
        helpText,
        className,
        inputClassName,
    },
    ref,
) => {
    const [showPassword, setShowPassword] = useState(false);
    const isInvalid = touched && error;
    const isValid = touched && !error && value;

    const strength = useMemo(() => {
        return getPasswordStrength(value);
    }, [value]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative group">
                <input
                    ref={ref}
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    id={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    autoComplete="password"
                    className={cn(
                        'w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl',
                        'transition-all duration-200 focus:outline-none',
                        'placeholder:text-slate-400 text-slate-900 pr-12',
                        isInvalid && 'border-red-500 bg-red-50 focus:border-red-600 focus:bg-white',
                        isValid && 'border-emerald-500 bg-emerald-50 focus:border-emerald-600',
                        !isInvalid && !isValid && 'focus:border-primary focus:bg-white',
                        disabled && 'opacity-50 cursor-not-allowed',
                        inputClassName,
                    )}
                />

                {/* Password visibility toggle */}
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={disabled}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {isValid && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckCircle2 size={18} />
                    </div>
                )}
                {isInvalid && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertCircle size={18} />
                    </div>
                )}
            </div>

            {/* Password Strength Meter */}
            {showStrength && value && (
                <PasswordStrengthMeter strength={strength} password={value} />
            )}

            {/* Error Message */}
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

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
