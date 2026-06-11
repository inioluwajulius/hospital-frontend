import { useState, useCallback } from 'react';

/**
 * Custom hook for form state management
 * Handles form data, touched fields, and validation state
 * @param {object} initialValues - Initial form data
 * @returns {object} - Form state and handlers
 */
export const useForm = (initialValues = {}) => {
    const [formData, setFormData] = useState(initialValues);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null,
            }));
        }
    }, [errors]);

    const handleBlur = useCallback((field) => {
        setTouched(prev => ({
            ...prev,
            [field]: true,
        }));
    }, []);

    const setFieldValue = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const setFieldError = useCallback((field, error) => {
        setErrors(prev => ({
            ...prev,
            [field]: error,
        }));
    }, []);

    const setFieldTouched = useCallback((field, isTouched = true) => {
        setTouched(prev => ({
            ...prev,
            [field]: isTouched,
        }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(initialValues);
        setTouched({});
        setErrors({});
    }, [initialValues]);

    const resetField = useCallback((field) => {
        setFormData(prev => ({
            ...prev,
            [field]: initialValues[field] || '',
        }));
        setTouched(prev => ({
            ...prev,
            [field]: false,
        }));
        setErrors(prev => ({
            ...prev,
            [field]: null,
        }));
    }, [initialValues]);

    return {
        formData,
        setFormData,
        touched,
        setTouched,
        errors,
        setErrors,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        resetForm,
        resetField,
    };
};

export default useForm;
