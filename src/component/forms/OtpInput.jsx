import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Six-box one-time code input.
 * - Typing a digit moves to the next box; Backspace on an empty box moves back.
 * - Arrow keys move between boxes; pasting a code fills every box.
 * - The first box advertises autocomplete="one-time-code" for SMS/email autofill.
 *
 * @param {string}   value     current code (digits only, up to `length`)
 * @param {Function} onChange  receives the new code string
 * @param {Function} [onComplete] called with the code once all boxes are filled
 */
const OtpInput = ({ value = '', onChange, onComplete, length = 6, disabled = false, error = false, autoFocus = true, label = 'Verification code' }) => {
    const inputs = useRef([]);
    const digits = Array.from({ length }, (_, i) => value[i] || '');

    useEffect(() => {
        if (autoFocus) inputs.current[0]?.focus();
    }, [autoFocus]);

    const focusBox = (index) => {
        const box = inputs.current[Math.max(0, Math.min(length - 1, index))];
        box?.focus();
        box?.select();
    };

    const update = (nextDigits) => {
        const code = nextDigits.join('').slice(0, length);
        onChange(code);
        if (code.length === length && !nextDigits.includes('')) onComplete?.(code);
    };

    const handleChange = (index, raw) => {
        const typed = raw.replace(/\D/g, '');
        if (!typed) return;
        // Several digits arrive at once from autofill or mobile keyboards
        const next = [...digits];
        typed.split('').forEach((d, offset) => {
            if (index + offset < length) next[index + offset] = d;
        });
        update(next);
        focusBox(index + typed.length);
    };

    const handleKeyDown = (index, event) => {
        if (event.key === 'Backspace') {
            event.preventDefault();
            const next = [...digits];
            if (next[index]) {
                next[index] = '';
            } else if (index > 0) {
                next[index - 1] = '';
                focusBox(index - 1);
            }
            update(next);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            focusBox(index - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            focusBox(index + 1);
        }
    };

    const handlePaste = (event) => {
        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!pasted) return;
        event.preventDefault();
        update(Array.from({ length }, (_, i) => pasted[i] || ''));
        focusBox(pasted.length);
    };

    return (
        <div role="group" aria-label={label} className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={length}
                    value={digit}
                    disabled={disabled}
                    aria-label={`${label} digit ${index + 1} of ${length}`}
                    aria-invalid={error || undefined}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className={cn(
                        'w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-extrabold text-slate-900 rounded-xl border-2 outline-none transition-all',
                        'bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15',
                        digit ? 'border-slate-300' : 'border-slate-200',
                        error && 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100',
                        disabled && 'opacity-60 cursor-not-allowed',
                    )}
                />
            ))}
        </div>
    );
};

export default OtpInput;
