import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Error Message Component
 * Displays form-level or field-level error messages
 */
export const FormError = ({ error, className }) => {
    if (!error) return null;

    return (
        <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200',
            className,
        )}>
            <div className="shrink-0 text-red-600 mt-0.5">
                <AlertCircle size={18} />
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
        </div>
    );
};

/**
 * Success Message Component
 * Displays form-level success messages
 */
export const FormSuccess = ({ message, className }) => {
    if (!message) return null;

    return (
        <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200',
            className,
        )}>
            <div className="shrink-0 text-emerald-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">{message}</p>
            </div>
        </div>
    );
};

/**
 * Form Section Component
 * Groups related form fields with optional title and description
 */
export const FormSection = ({ title, description, children, className }) => {
    return (
        <div className={cn('space-y-6', className)}>
            {(title || description) && (
                <div className="mb-6">
                    {title && (
                        <h2 className="text-lg font-bold text-slate-900 mb-1">{title}</h2>
                    )}
                    {description && (
                        <p className="text-sm text-slate-600">{description}</p>
                    )}
                </div>
            )}
            <div className="space-y-5">
                {children}
            </div>
        </div>
    );
};

/**
 * Form Actions Component
 * Groups form action buttons (submit, cancel, etc.)
 */
export const FormActions = ({ children, className, layout = 'horizontal' }) => {
    return (
        <div className={cn(
            'flex gap-3',
            layout === 'vertical' ? 'flex-col' : 'flex-row justify-end',
            className,
        )}>
            {children}
        </div>
    );
};

/**
 * Form Submit Button Component
 * Styled submit button with loading state
 */
export const FormSubmitButton = ({
    children = 'Submit',
    isLoading = false,
    disabled = false,
    className,
    ...props
}) => {
    return (
        <button
            type="submit"
            disabled={isLoading || disabled}
            className={cn(
                'px-6 py-3 bg-linear-to-r from-primary to-primary/90 hover:to-primary/80',
                'text-white font-bold rounded-xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
                className,
            )}
            {...props}
        >
            {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
};

/**
 * Form Cancel Button Component
 * Styled cancel button
 */
export const FormCancelButton = ({
    children = 'Cancel',
    onClick,
    className,
    ...props
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold',
                'rounded-xl transition-all duration-200 focus:outline-none',
                'focus:ring-2 focus:ring-slate-300 focus:ring-offset-2',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default {
    FormError,
    FormSuccess,
    FormSection,
    FormActions,
    FormSubmitButton,
    FormCancelButton,
};
