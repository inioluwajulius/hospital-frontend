import { io } from 'socket.io-client';
import { attachCallHandlers, resetCalls } from './callStore';

// The socket server is the backend host (the API base URL without /api/v1),
// not the frontend's own origin.
const getSocketURL = () => {
    let apiUrl = import.meta.env.VITE_API_BASE_URL || "https://hospital-backend-xdjf.onrender.com";
    if (apiUrl.endsWith('/api/v1')) apiUrl = apiUrl.replace('/api/v1', '');
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.replace('/api', '');
    return apiUrl;
};

const SOCKET_URL = getSocketURL();

let socket;
let socketUser;

// The account a token belongs to (a refreshed token for the same person keeps the connection)
const tokenUser = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).userId || token;
    } catch {
        return token;
    }
};

export const initSocket = () => {
    const token = localStorage.getItem('token');
    // A different account signed in on this tab: never keep receiving the previous user's events
    if (socket && socketUser !== (token && tokenUser(token))) disconnectSocket();
    if (socket) return socket;

    if (!token) return null;
    socketUser = tokenUser(token);

    socket = io(SOCKET_URL, {
        auth: { token },
        // Kept for backends deployed before handshake.auth support; remove once updated
        query: { token }
    });

    socket.on('connect', () => {
        // Connection established
    });

    socket.on('connect_error', () => {
        // Socket connection failed — notifications may be unavailable
    });

    // Incoming-call popup and ringtone, once per connection (works on every page)
    attachCallHandlers(socket);

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    resetCalls();
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
