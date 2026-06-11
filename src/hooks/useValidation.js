import { useState, useCallback, useMemo } from 'react';
import {
    validateEmailForUserType,
    validatePassword,
    validatePasswordMatch,
    validateName,
    validatePhoneNumber,
    validateLicenseNumber,
    validateYearsOfExperience,
    validateSpecialization,
    validateGender,
    validateBloodGroup,
    validateAge,
} from '../utils/validation/index.js';

/**
 * Custom hook for field-level validation
 * Provides validation functions and error state management
 * @param {object} validationRules - Custom validation rules for fields
 * @returns {object} - Validation state and handlers
 */
export const useValidation = (_validationRules = {}) => {
    const [fieldErrors, setFieldErrors] = useState({});
    const [validationState, setValidationState] = useState({});

    /**
     * Validate email field
     * @param {string} email - Email to validate
     * @param {string} userType - 'patient' or 'staff'
     * @returns {boolean} - Is valid
     */
    const validateEmail = useCallback((email, userType = 'patient') => {
        const result = validateEmailForUserType(email, userType);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                email: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                email: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Get password strength validation
     * @param {string} password - Password to validate
     * @returns {object} - { isValid, error, checks }
     */
    const getPasswordValidation = useCallback((password) => {
        const result = validatePassword(password);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                password: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                password: null,
            }));
        }
        setValidationState(prev => ({
            ...prev,
            passwordChecks: result.checks,
        }));
        return result;
    }, []);

    /**
     * Validate password match
     * @param {string} password - Original password
     * @param {string} confirmPassword - Confirmation password
     * @returns {boolean} - Match result
     */
    const validatePasswordConfirm = useCallback((password, confirmPassword) => {
        const result = validatePasswordMatch(password, confirmPassword);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                confirmPassword: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                confirmPassword: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate full name
     * @param {string} name - Name to validate
     * @returns {boolean} - Is valid
     */
    const validateFullName = useCallback((name) => {
        const result = validateName(name);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                name: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                name: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate phone number
     * @param {string} phone - Phone to validate
     * @returns {boolean} - Is valid
     */
    const validatePhone = useCallback((phone) => {
        const result = validatePhoneNumber(phone);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                phone: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                phone: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate medical license
     * @param {string} license - License to validate
     * @returns {boolean} - Is valid
     */
    const validateLicense = useCallback((license) => {
        const result = validateLicenseNumber(license);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                licenseNumber: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                licenseNumber: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate years of experience
     * @param {number|string} experience - Experience to validate
     * @returns {boolean} - Is valid
     */
    const validateExperience = useCallback((experience) => {
        const result = validateYearsOfExperience(experience);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                yearsOfExperience: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                yearsOfExperience: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate specialization
     * @param {string} spec - Specialization to validate
     * @returns {boolean} - Is valid
     */
    const validateSpec = useCallback((spec) => {
        const result = validateSpecialization(spec);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                specialization: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                specialization: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate gender
     * @param {string} gender - Gender to validate
     * @returns {boolean} - Is valid
     */
    const validateGenderField = useCallback((gender) => {
        const result = validateGender(gender);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                gender: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                gender: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate blood group
     * @param {string} bg - Blood group to validate
     * @returns {boolean} - Is valid
     */
    const validateBlood = useCallback((bg) => {
        const result = validateBloodGroup(bg);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                bloodGroup: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                bloodGroup: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Validate age
     * @param {number|string} ageValue - Age to validate
     * @param {string} userType - 'patient' or 'doctor'
     * @returns {boolean} - Is valid
     */
    const validateAgeField = useCallback((ageValue, userType = 'patient') => {
        const result = validateAge(ageValue, userType);
        if (result.error) {
            setFieldErrors(prev => ({
                ...prev,
                age: result.error,
            }));
        } else {
            setFieldErrors(prev => ({
                ...prev,
                age: null,
            }));
        }
        return result.isValid;
    }, []);

    /**
     * Set error for specific field
     * @param {string} field - Field name
     * @param {string} error - Error message
     * @returns {void}
     */
    const setFieldError = useCallback((field, error) => {
        setFieldErrors(prev => ({
            ...prev,
            [field]: error,
        }));
    }, []);

    /**
     * Clear all field errors
     * @returns {void}
     */
    const clearAllErrors = useCallback(() => {
        setFieldErrors({});
    }, []);

    /**
     * Clear error for specific field
     * @param {string} field - Field name
     * @returns {void}
     */
    const clearFieldError = useCallback((field) => {
        setFieldErrors(prev => ({
            ...prev,
            [field]: null,
        }));
    }, []);

    /**
     * Check if all required fields are valid
     * @param {array} requiredFields - Array of field names to check
     * @returns {boolean} - Are all fields valid
     */
    const areAllFieldsValid = useCallback((requiredFields) => {
        return requiredFields.every(field => !fieldErrors[field]);
    }, [fieldErrors]);

    // Calculate which password checks are met
    const passwordStrengthStatus = useMemo(() => {
        return validationState.passwordChecks || {
            minLength: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false,
            isStrong: false,
        };
    }, [validationState.passwordChecks]);

    return {
        fieldErrors,
        setFieldError,
        clearAllErrors,
        clearFieldError,
        validateEmail,
        getPasswordValidation,
        validatePasswordConfirm,
        validateFullName,
        validatePhone,
        validateLicense,
        validateExperience,
        validateSpec,
        validateGenderField,
        validateBlood,
        validateAgeField,
        areAllFieldsValid,
        passwordStrengthStatus,
    };
};

export default useValidation;
