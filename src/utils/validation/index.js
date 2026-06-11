// Email validation
export {
    isValidEmailFormat,
    isStaffEmail,
    isPersonalEmail,
    validateEmailForUserType,
    getEmailDomain,
    getEmailLocalPart,
} from './email.js';

// Password validation
export {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    getPasswordChecks,
    validatePassword,
    isPasswordStrong,
    validatePasswordMatch,
    getPasswordStrength,
    getPasswordStrengthLabel,
} from './password.js';

// Form field validation
export {
    validateName,
    validatePhoneNumber,
    validateLicenseNumber,
    validateYearsOfExperience,
    validateSpecialization,
    validateGender,
    validateBloodGroup,
    validateAge,
    formatPhoneNumber,
    parsePhoneNumber,
    validateFormField,
} from './form.js';
