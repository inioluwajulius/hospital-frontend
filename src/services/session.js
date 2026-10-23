import { disconnectSocket } from './socket';

/**
 * Log the current user out: clear stored credentials, close the notification
 * socket, and return to the login page matching their role.
 */
export const logout = () => {
    let role = '';
    try {
        role = JSON.parse(localStorage.getItem('user') || '{}').role || '';
    } catch {
        // ignore corrupt stored user
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();

    window.location.href = role && role !== 'patient' ? '/auth/login/doctor' : '/auth/login/patient';
};
