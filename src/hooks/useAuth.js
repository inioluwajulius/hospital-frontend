import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Custom hook for authentication management
 * Handles login, registration, token storage, and user state
 * @returns {object} - Auth state and handlers
 */
export const useAuth = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading] = useState(false);

    const getRegistrationErrorMessage = useCallback((err) => {
        const message = err?.response?.data?.message || 'Registration failed. Please try again.';

        if (message === 'Email already exists') {
            return 'An account already exists with this email address. Use a different email or log in instead.';
        }

        return message;
    }, []);

    const setToken = useCallback((token) => {
        if (token) {
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        }
    }, []);

    const setUserData = useCallback((userData) => {
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } else {
            localStorage.removeItem('user');
            setUser(null);
        }
    }, []);

    /**
     * Register a new user
     * @param {object} payload - Registration data
     * @returns {Promise}
     */
    const register = useCallback(async (payload) => {
        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/register', payload);
            setMessage(response.data?.message || 'Registration successful!');
            return response.data;
        } catch (err) {
            setError(getRegistrationErrorMessage(err));
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [getRegistrationErrorMessage]);

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise}
     */
    const login = useCallback(async (email, password) => {
        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            setToken(token);
            setUserData(userData);
            setMessage('Login successful!');

            return { token, user: userData };
        } catch (err) {
            const errorMessage = err?.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [setToken, setUserData]);

    /**
     * Logout user
     * @returns {void}
     */
    const logout = useCallback(() => {
        setToken(null);
        setUserData(null);
        setError('');
        setMessage('');
        navigate('/login/patient');
    }, [setToken, setUserData, navigate]);

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    const isAuthenticated = useCallback(() => {
        const token = localStorage.getItem('token');
        return !!token && !!user;
    }, [user]);

    /**
     * Get current auth token
     * @returns {string|null}
     */
    const getToken = useCallback(() => {
        return localStorage.getItem('token');
    }, []);

    /**
     * Clear auth state
     * @returns {void}
     */
    const clearAuth = useCallback(() => {
        setToken(null);
        setUserData(null);
        setError('');
        setMessage('');
    }, [setToken, setUserData]);

    return {
        user,
        isAuthenticated: isAuthenticated(),
        isSubmitting,
        isLoading,
        error,
        message,
        register,
        login,
        logout,
        setUser: setUserData,
        setToken,
        getToken,
        clearAuth,
        setError,
        setMessage,
    };
};

export default useAuth;
