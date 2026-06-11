import { VALIDATION_ERRORS, AGE_LIMITS, LICENSE_FORMAT, PHONE_FORMAT } from '../../constants/index.js';

/**
 * Validate full name
 * @param {string} name - Name to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateName = (name) => {
    if (!name || !name.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.NAME_REQUIRED };
    }

    if (name.trim().length < 2) {
        return { isValid: false, error: VALIDATION_ERRORS.NAME_TOO_SHORT };
    }

    return { isValid: true, error: null };
};

/**
 * Validate phone number (Nigerian format)
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validatePhoneNumber = (phone) => {
    if (!phone || !phone.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.PHONE_REQUIRED };
    }

    // Remove spaces and check format
    const cleanPhone = phone.replace(/\s/g, '');
    if (!PHONE_FORMAT.PATTERN.test(cleanPhone)) {
        return { isValid: false, error: VALIDATION_ERRORS.PHONE_INVALID };
    }

    return { isValid: true, error: null };
};

/**
 * Validate medical license number
 * @param {string} license - License number to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateLicenseNumber = (license) => {
    if (!license || !license.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.LICENSE_REQUIRED };
    }

    if (!LICENSE_FORMAT.PATTERN.test(license.toUpperCase())) {
        return { isValid: false, error: VALIDATION_ERRORS.LICENSE_INVALID };
    }

    return { isValid: true, error: null };
};

/**
 * Validate years of experience
 * @param {number|string} experience - Years to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateYearsOfExperience = (experience) => {
    if (experience === null || experience === undefined || experience === '') {
        return { isValid: false, error: VALIDATION_ERRORS.EXPERIENCE_REQUIRED };
    }

    const experienceNum = Number(experience);
    if (isNaN(experienceNum) || experienceNum < 0 || experienceNum > 70) {
        return { isValid: false, error: VALIDATION_ERRORS.EXPERIENCE_INVALID };
    }

    return { isValid: true, error: null };
};

/**
 * Validate specialization
 * @param {string} specialization - Specialization value
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateSpecialization = (specialization) => {
    if (!specialization || !specialization.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.SPECIALIZATION_REQUIRED };
    }

    return { isValid: true, error: null };
};

/**
 * Validate gender selection
 * @param {string} gender - Gender value
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateGender = (gender) => {
    if (!gender) {
        return { isValid: false, error: VALIDATION_ERRORS.GENDER_REQUIRED };
    }

    return { isValid: true, error: null };
};

/**
 * Validate blood group selection
 * @param {string} bloodGroup - Blood group value
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateBloodGroup = (bloodGroup) => {
    if (!bloodGroup) {
        return { isValid: false, error: VALIDATION_ERRORS.BLOOD_GROUP_REQUIRED };
    }

    return { isValid: true, error: null };
};

/**
 * Validate age
 * @param {number|string} age - Age value
 * @param {string} userType - 'patient' or 'doctor'
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateAge = (age, userType = 'patient') => {
    if (age === null || age === undefined || age === '') {
        return { isValid: false, error: VALIDATION_ERRORS.AGE_REQUIRED };
    }

    const ageNum = Number(age);
    if (isNaN(ageNum)) {
        return { isValid: false, error: VALIDATION_ERRORS.AGE_INVALID };
    }

    const limits = userType === 'doctor' ? AGE_LIMITS.DOCTOR_MIN : AGE_LIMITS.PATIENT_MIN;
    const max = userType === 'doctor' ? AGE_LIMITS.DOCTOR_MAX : AGE_LIMITS.PATIENT_MAX;

    if (ageNum < limits || ageNum > max) {
        return { isValid: false, error: VALIDATION_ERRORS.AGE_INVALID };
    }

    return { isValid: true, error: null };
};

/**
 * Format phone number (Nigerian)
 * @param {string} phone - Raw phone input
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // If it starts with 234, add +
    if (cleaned.startsWith('234')) {
        return `+${cleaned}`;
    }

    // If it starts with 0, replace with +234
    if (cleaned.startsWith('0')) {
        return `+234${cleaned.slice(1)}`;
    }

    // Return as is if already formatted or incomplete
    return cleaned;
};

/**
 * Parse phone number to components
 * @param {string} phone - Phone number
 * @returns {object} - { countryCode, areaCode, number }
 */
export const parsePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return {
        countryCode: cleaned.slice(0, 3),
        areaCode: cleaned.slice(3, 6),
        number: cleaned.slice(6),
    };
};

/**
 * Validate form field (generic validation based on field type)
 * @param {string} fieldName - Name of the field
 * @param {string} value - Field value
 * @param {string} userType - 'patient' or 'doctor' (for context)
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateFormField = (fieldName, value, userType = 'patient') => {
    const validationMap = {
        name: () => validateName(value),
        email: () => ({ isValid: true, error: null }), // Email handled separately
        password: () => ({ isValid: true, error: null }), // Password handled separately
        phone: () => validatePhoneNumber(value),
        specialization: () => validateSpecialization(value),
        licenseNumber: () => validateLicenseNumber(value),
        yearsOfExperience: () => validateYearsOfExperience(value),
        gender: () => validateGender(value),
        bloodGroup: () => validateBloodGroup(value),
        age: () => validateAge(value, userType),
    };

    const validator = validationMap[fieldName];
    if (validator) {
        return validator();
    }

    return { isValid: true, error: null };
};
