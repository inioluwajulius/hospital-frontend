/**
 * Authentication & User Type Constants
 */
export const USER_TYPES = {
    PATIENT: 'patient',
    DOCTOR: 'staff',
};

export const USER_ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    STAFF: 'staff',
    PATIENT: 'patient',
};

export const USER_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    REJECTED: 'rejected',
    INACTIVE: 'inactive',
};

/**
 * Email Domain Validation
 */
export const EMAIL_DOMAINS = {
    HOSPITAL: ['@hospital.com', '@healthcare.com', '@medical.com'],
    PERSONAL: ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@aol.com', '@mail.com'],
};

/**
 * Password Requirements
 */
export const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 8,
    REQUIRES_UPPERCASE: true,
    REQUIRES_LOWERCASE: true,
    REQUIRES_NUMBER: true,
    REQUIRES_SPECIAL: true,
};

export const PASSWORD_ERROR_MESSAGE = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
    },
    USERS: {
        PENDING: '/users/registrations/pending',
        APPROVE: (userId) => `/users/${userId}/approve`,
        REJECT: (userId) => `/users/${userId}/reject`,
    },
    PATIENTS: {
        ALL: '/patients',
        PENDING: '/patients/registrations/pending',
        SEARCH: '/patients/search/existing',
        APPROVE: (patientId) => `/patients/${patientId}/approve`,
        REJECT: (patientId) => `/patients/${patientId}/reject`,
    },
};

/**
 * Routes
 */
export const APP_ROUTES = {
    HOME: '/',
    LOGIN_PATIENT: '/login/patient',
    LOGIN_DOCTOR: '/login/doctor',
    REGISTER_PATIENT: '/register/patient',
    REGISTER_DOCTOR: '/register/doctor',
    DASHBOARD: '/dashboard',
    PENDING_DOCTORS: '/pending-doctors',
    ADMIN_SETUP: '/admin-setup',
};

/**
 * UI/UX Constants
 */
export const ANIMATION_DURATION = {
    FAST: 0.3,
    NORMAL: 0.5,
    SLOW: 0.8,
};

export const DEBOUNCE_DELAY = 300;
export const TOAST_DURATION = 3000;
