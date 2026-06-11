import { useState, useCallback } from 'react';
import { formatPhoneNumber, parsePhoneNumber } from '../utils/validation/form.js';
import { PHONE_FORMAT } from '../constants/validation.constants.js';

/**
 * Custom hook for phone number formatting
 * Handles real-time formatting and validation
 * @returns {object} - Phone state and handlers
 */
export const usePhoneFormat = () => {
    const [phoneValue, setPhoneValue] = useState('');
    const [displayValue, setDisplayValue] = useState('');

    /**
     * Format phone input with proper spacing and validation
     * @param {string} input - Raw phone input
     * @returns {object} - { formatted, display }
     */
    const formatPhone = useCallback((input) => {
        if (!input) {
            setPhoneValue('');
            setDisplayValue('');
            return { formatted: '', display: '' };
        }

        // Format the phone number
        const formatted = formatPhoneNumber(input);

        // Create display format: +234 123 456 7890
        const parsed = parsePhoneNumber(formatted);
        let display = '';

        if (parsed.countryCode) {
            display += `+${parsed.countryCode}`;
            if (parsed.areaCode) {
                display += ` ${parsed.areaCode}`;
                if (parsed.number) {
                    // Format remaining digits in groups
                    const numDigits = parsed.number;
                    if (numDigits.length <= 3) {
                        display += ` ${numDigits}`;
                    } else if (numDigits.length <= 6) {
                        display += ` ${numDigits.slice(0, 3)} ${numDigits.slice(3)}`;
                    } else {
                        display += ` ${numDigits.slice(0, 3)} ${numDigits.slice(3, 7)} ${numDigits.slice(7)}`;
                    }
                }
            }
        }

        setPhoneValue(formatted);
        setDisplayValue(display);

        return { formatted, display };
    }, []);

    /**
     * Handle phone input change
     * @param {Event} e - Input change event
     * @returns {void}
     */
    const handlePhoneChange = useCallback((e) => {
        const input = e.target.value;
        const result = formatPhone(input);
        e.target.value = result.display;
    }, [formatPhone]);

    /**
     * Get clean phone value (digits + country code only)
     * @returns {string} - Formatted phone without spaces
     */
    const getCleanPhoneValue = useCallback(() => {
        return phoneValue;
    }, [phoneValue]);

    /**
     * Get display phone value (with spaces)
     * @returns {string} - Formatted phone with spaces
     */
    const getDisplayPhoneValue = useCallback(() => {
        return displayValue;
    }, [displayValue]);

    /**
     * Reset phone value
     * @returns {void}
     */
    const resetPhone = useCallback(() => {
        setPhoneValue('');
        setDisplayValue('');
    }, []);

    /**
     * Set phone value directly
     * @param {string} value - Phone value to set
     * @returns {void}
     */
    const setPhone = useCallback((value) => {
        formatPhone(value);
    }, [formatPhone]);

    /**
     * Check if phone is valid
     * @returns {boolean}
     */
    const isValidPhone = useCallback(() => {
        return PHONE_FORMAT.PATTERN.test(phoneValue);
    }, [phoneValue]);

    return {
        phoneValue,
        displayValue,
        formatPhone,
        handlePhoneChange,
        getCleanPhoneValue,
        getDisplayPhoneValue,
        resetPhone,
        setPhone,
        isValidPhone,
    };
};

export default usePhoneFormat;
