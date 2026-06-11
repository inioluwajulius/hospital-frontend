import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { getPasswordChecks, getPasswordStrengthLabel } from '../../utils/validation/password.js';
import { cn } from '../../lib/utils';

/**
 * Password Strength Meter Component
 * Shows visual strength indicator and requirement checklist
 */
const PasswordStrengthMeter = ({ strength = 0, password = '' }) => {
    const checks = useMemo(() => {
        return getPasswordChecks(password);
    }, [password]);

    const strengthLabel = getPasswordStrengthLabel(password);

    // Color and styling based on strength
    const strengthConfig = {
        0: { gradient: 'linear-gradient(to right, #ef4444, #dc2626)', label: 'Weak', width: 'w-1/5' },
        1: { gradient: 'linear-gradient(to right, #f97316, #ea580c)', label: 'Fair', width: 'w-2/5' },
        2: { gradient: 'linear-gradient(to right, #eab308, #ca8a04)', label: 'Good', width: 'w-3/5' },
        3: { gradient: 'linear-gradient(to right, #22c55e, #16a34a)', label: 'Strong', width: 'w-4/5' },
        4: { gradient: 'linear-gradient(to right, #10b981, #059669)', label: 'Very Strong', width: 'w-full' },
    };

    const config = strengthConfig[strength] || strengthConfig[0];

    const requirements = [
        {
            label: 'At least 8 characters',
            met: checks.minLength,
        },
        {
            label: 'One uppercase letter',
            met: checks.uppercase,
        },
        {
            label: 'One lowercase letter',
            met: checks.lowercase,
        },
        {
            label: 'One number',
            met: checks.number,
        },
        {
            label: 'One special character (!@#$%^&*)',
            met: checks.special,
        },
    ];

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Password Strength</span>
                    <span className={cn('text-xs font-bold', {
                        'text-red-600': strength === 0,
                        'text-orange-600': strength === 1,
                        'text-amber-600': strength === 2,
                        'text-green-600': strength === 3,
                        'text-emerald-600': strength === 4,
                    })}>
                        {strengthLabel}
                    </span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        style={{
                            height: '100%',
                            background: config.gradient,
                            transition: 'width 500ms ease-in-out',
                        }}
                        className={cn('rounded-full', config.width)}
                    />
                </div>
            </div>

            {/* Requirements Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requirements.map((req, index) => (
                    <div
                        key={index}
                        className={cn(
                            'flex items-center gap-2 text-xs p-2 rounded-lg transition-all',
                            req.met
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                        )}
                    >
                        {req.met ? (
                            <Check size={14} className="shrink-0 text-emerald-600" />
                        ) : (
                            <X size={14} className="shrink-0 text-slate-400" />
                        )}
                        <span>{req.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
