import { EMAIL_DOMAINS, VALIDATION_ERRORS } from '../../constants/index.js';

/**
 * Basic email format validation
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email has valid format
 */
export const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check if email domain is a hospital/staff email
 * @param {string} email - Email to check
 * @returns {boolean} - True if email has hospital domain
 */
export const isStaffEmail = (email) => {
    if (!email) return false;
    const domain = email.substring(email.lastIndexOf('@'));
    return EMAIL_DOMAINS.HOSPITAL.includes(domain);
};

/**
 * Check if email domain is a personal email
 * @param {string} email - Email to check
 * @returns {boolean} - True if email has personal domain
 */
export const isPersonalEmail = (email) => {
    if (!email) return false;
    const domain = email.substring(email.lastIndexOf('@'));
    return EMAIL_DOMAINS.PERSONAL.includes(domain);
};

/**
 * Validate email for given user type
 * @param {string} email - Email to validate
 * @param {string} userType - 'patient' or 'staff'
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateEmailForUserType = (email, userType) => {
    if (!email) {
        return { isValid: false, error: VALIDATION_ERRORS.EMAIL_REQUIRED };
    }

    if (!isValidEmailFormat(email)) {
        return { isValid: false, error: VALIDATION_ERRORS.EMAIL_INVALID };
    }

    if (userType === 'patient') {
        if (!isPersonalEmail(email)) {
            return { isValid: false, error: VALIDATION_ERRORS.EMAIL_NOT_PERSONAL };
        }
    } else if (userType === 'staff') {
        if (!isStaffEmail(email)) {
            return { isValid: false, error: VALIDATION_ERRORS.EMAIL_NOT_STAFF };
        }
    }

    return { isValid: true, error: null };
};

/**
 * Get email domain from email string
 * @param {string} email - Email address
 * @returns {string} - Domain without @
 */
export const getEmailDomain = (email) => {
    if (!email) return '';
    return email.substring(email.lastIndexOf('@') + 1);
};

/**
 * Extract email local part (before @)
 * @param {string} email - Email address
 * @returns {string} - Local part of email
 */
export const getEmailLocalPart = (email) => {
    if (!email) return '';
    return email.substring(0, email.lastIndexOf('@'));
};
