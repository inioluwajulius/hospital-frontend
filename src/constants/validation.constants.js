/**
 * Doctor Specializations
 */
export const DOCTOR_SPECIALIZATIONS = [
    'General Practice',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Neurology',
    'Psychiatry',
    'Dermatology',
    'Ophthalmology',
    'ENT (Otolaryngology)',
    'Gastroenterology',
    'Urology',
    'Rheumatology',
    'Oncology',
    'Surgery',
    'Emergency Medicine',
];

/**
 * Validation Error Messages
 */
export const VALIDATION_ERRORS = {
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Please enter a valid email address',
    EMAIL_NOT_STAFF: 'Email must be a hospital email (@hospital.com, @healthcare.com, or @medical.com)',
    EMAIL_NOT_PERSONAL: 'Email must be a personal email (@gmail.com, @yahoo.com, @outlook.com, @hotmail.com, @aol.com, or @mail.com)',
    EMAIL_EXISTS: 'Email already registered',
    
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORD_NO_UPPERCASE: 'Password must include at least one uppercase letter',
    PASSWORD_NO_LOWERCASE: 'Password must include at least one lowercase letter',
    PASSWORD_NO_NUMBER: 'Password must include at least one number',
    PASSWORD_NO_SPECIAL: 'Password must include at least one special character (!@#$%^&*)',
    PASSWORD_MISMATCH: 'Passwords do not match',
    
    NAME_REQUIRED: 'Full name is required',
    NAME_TOO_SHORT: 'Full name must be at least 2 characters',
    
    PHONE_REQUIRED: 'Phone number is required',
    PHONE_INVALID: 'Please enter a valid Nigerian phone number',
    
    SPECIALIZATION_REQUIRED: 'Specialization is required',
    LICENSE_REQUIRED: 'Medical license number is required',
    LICENSE_INVALID: 'Medical license number must be alphanumeric',
    LICENSE_EXISTS: 'Medical license number already registered',
    
    EXPERIENCE_REQUIRED: 'Years of experience is required',
    EXPERIENCE_INVALID: 'Years of experience must be a valid number',
    
    GENDER_REQUIRED: 'Please select your gender',
    BLOOD_GROUP_REQUIRED: 'Please select your blood group',
    AGE_REQUIRED: 'Age is required',
    AGE_INVALID: 'Please enter a valid age',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
    REGISTRATION_PATIENT: 'Patient registered successfully! You can now log in.',
    REGISTRATION_DOCTOR: 'Doctor registered successfully! Your registration is pending admin approval.',
    LOGIN_SUCCESS: 'Login successful!',
    PATIENT_APPROVED: 'Patient approved successfully',
    DOCTOR_APPROVED: 'Doctor approved successfully',
};

/**
 * Gender Options
 */
export const GENDER_OPTIONS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
];

/**
 * Blood Group Options
 */
export const BLOOD_GROUP_OPTIONS = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
];

/**
 * Age Range Validation
 */
export const AGE_LIMITS = {
    PATIENT_MIN: 0,
    PATIENT_MAX: 150,
    DOCTOR_MIN: 21,
    DOCTOR_MAX: 75,
};

/**
 * Medical License Format (for validation hints)
 */
export const LICENSE_FORMAT = {
    PATTERN: /^[A-Z0-9]{5,20}$/,
    EXAMPLE: 'MCN123456',
    HELP_TEXT: 'Medical license number (alphanumeric, 5-20 characters)',
};

/**
 * Phone Number Format
 */
export const PHONE_FORMAT = {
    COUNTRY_CODE: '+234',
    PLACEHOLDER: '+234 123 456 7890',
    PATTERN: /^\+234\d{10}$/,
    HELP_TEXT: 'Nigerian phone number (e.g., +234 123 456 7890)',
};

/**
 * Form Field Placeholders
 */
export const FORM_PLACEHOLDERS = {
    PATIENT_NAME: 'Your Full Name',
    DOCTOR_NAME: 'Your Full Name',
    EMAIL: 'Enter your email',
    PASSWORD: 'Enter password',
    CONFIRM_PASSWORD: 'Confirm password',
    PHONE: '+234 123 456 7890',
    LICENSE: 'MCN123456',
    YEARS_EXPERIENCE: 'e.g., 5',
};

/**
 * Form Label Texts
 */
export const FORM_LABELS = {
    FULL_NAME: 'Full Name',
    EMAIL: 'Email Address',
    PASSWORD: 'Password',
    CONFIRM_PASSWORD: 'Confirm Password',
    PHONE: 'Phone Number',
    SPECIALIZATION: 'Medical Specialization',
    LICENSE: 'Medical License Number',
    EXPERIENCE: 'Years of Experience',
    GENDER: 'Gender',
    BLOOD_GROUP: 'Blood Group',
    AGE: 'Age',
};
