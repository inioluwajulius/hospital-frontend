import { io } from 'socket.io-client';

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

export const initSocket = () => {
    if (socket) return socket;

    const token = localStorage.getItem('token');
    
    if (!token) return null;

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

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
