/* global process */
import { VALIDATION_ERRORS } from '../constants/validation.constants.js';

/**
 * Error handling service
 * Provides consistent error messages and error state management
 */
class ErrorHandlingService {
    /**
     * Get error message from validation error
     * @param {string} errorCode - Error code from VALIDATION_ERRORS
     * @returns {string} - Formatted error message
     */
    static getValidationError(errorCode) {
        return VALIDATION_ERRORS[errorCode] || 'An error occurred. Please try again.';
    }

    /**
     * Extract error message from API response
     * @param {Error} error - Axios error object
     * @returns {string} - Error message
     */
    static getApiError(error) {
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }

        if (error?.message) {
            return error.message;
        }

        if (error?.response?.status === 401) {
            return 'Session expired. Please login again.';
        }

        if (error?.response?.status === 403) {
            return 'You are not authorized to perform this action.';
        }

        if (error?.response?.status === 404) {
            return 'The requested resource was not found.';
        }

        if (error?.response?.status === 500) {
            return 'Server error. Please try again later.';
        }

        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Format validation errors from multiple fields
     * @param {object} errors - Object with field names as keys and errors as values
     * @returns {string} - Formatted error message
     */
    static formatMultipleErrors(errors) {
        const errorMessages = Object.entries(errors)
            .filter(([, error]) => error)
            .map(([field, error]) => `${field}: ${error}`);

        return errorMessages.join('\n');
    }

    /**
     * Get user-friendly error message
     * @param {string|Error} error - Error to format
     * @returns {string} - User-friendly message
     */
    static formatError(error) {
        if (typeof error === 'string') {
            return error;
        }

        if (error instanceof Error) {
            return error.message;
        }

        return this.getApiError(error);
    }

    /**
     * Check if error is a validation error
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isValidationError(error) {
        return error?.response?.status === 400 || error?.name === 'ValidationError';
    }

    /**
     * Check if error is an authentication error
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isAuthError(error) {
        return error?.response?.status === 401;
    }

    /**
     * Check if error is an authorization error
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isAuthorizationError(error) {
        return error?.response?.status === 403;
    }

    /**
     * Check if error is a server error
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isServerError(error) {
        return error?.response?.status >= 500;
    }

    /**
     * Check if error is a network error
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isNetworkError(error) {
        return error?.message === 'Network Error' || !error?.response;
    }

    /**
     * Create error object with consistent structure
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {object} details - Additional error details
     * @returns {object} - Error object
     */
    static createError(message, code = 'ERROR', details = {}) {
        return {
            message,
            code,
            details,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Log error to console in development
     * @param {Error} error - Error to log
     * @param {string} context - Context where error occurred
     * @returns {void}
     */
    static logError(error, context = '') {
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error(`[${context}]`, error);
        }
    }

    /**
     * Parse field-specific errors from API response
     * @param {Error} error - API error response
     * @returns {object} - Object with field names as keys and error messages as values
     */
    static parseFieldErrors(error) {
        const fieldErrors = error?.response?.data?.errors || {};

        if (typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
            return fieldErrors;
        }

        return {};
    }

    /**
     * Get retry-able error check
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isRetryable(error) {
        // Network errors, timeouts, and 5xx errors are retryable
        return (
            this.isNetworkError(error) ||
            this.isServerError(error) ||
            error?.code === 'ECONNABORTED'
        );
    }
}

export default ErrorHandlingService;
