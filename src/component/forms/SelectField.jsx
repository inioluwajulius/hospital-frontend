import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Reusable select/dropdown component
 * Handles validation and error display
 */
export const SelectField = React.forwardRef((
    {
        label,
        name,
        options = [],
        value,
        onChange,
        onBlur,
        error,
        touched,
        disabled = false,
        required = false,
        helpText,
        placeholder = 'Select an option',
        icon: Icon,
        className,
        selectClassName,
    },
    ref,
) => {
    const isInvalid = touched && error;
    const isValid = touched && !error && value;

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-10">
                        <Icon size={18} />
                    </div>
                )}

                <select
                    ref={ref}
                    name={name}
                    id={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    className={cn(
                        'w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl',
                        'transition-all duration-200 focus:outline-none',
                        'text-slate-900 appearance-none cursor-pointer',
                        Icon && 'pl-12',
                        'pr-10',
                        isInvalid && 'border-red-500 bg-red-50 focus:border-red-600 focus:bg-white',
                        isValid && 'border-emerald-500 bg-emerald-50 focus:border-emerald-600',
                        !isInvalid && !isValid && 'focus:border-primary focus:bg-white',
                        disabled && 'opacity-50 cursor-not-allowed',
                        selectClassName,
                    )}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {Array.isArray(options) && options.map((option, index) => {
                        const optionValue = typeof option === 'string' ? option : option.value;
                        const optionLabel = typeof option === 'string' ? option : option.label;

                        return (
                            <option key={index} value={optionValue}>
                                {optionLabel}
                            </option>
                        );
                    })}
                </select>

                {/* Dropdown Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </div>

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

SelectField.displayName = 'SelectField';

export default SelectField;
