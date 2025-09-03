import { io } from 'socket.io-client';

let socketInstance = null;
let currentProjectId = null;

export const initializeSocket = (projectId) => {
    // If we already have a socket connected to the same project, return it
    if (socketInstance && socketInstance.connected && currentProjectId === projectId) {
        console.log('Socket already connected to this project');
        return socketInstance;
    }

    // Disconnect existing socket if it exists
    if (socketInstance) {
        console.log('Disconnecting existing socket');
        socketInstance.disconnect();
        socketInstance = null;
        currentProjectId = null;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No token found for socket connection');
        return null;
    }

    if (!projectId) {
        console.error('No projectId provided for socket connection');
        return null;
    }

    console.log('Initializing socket connection...');
    console.log('API URL:', import.meta.env.VITE_API_URL);
    console.log('Project ID:', projectId);

    socketInstance = io(import.meta.env.VITE_API_URL, {
        auth: {
            token: token
        },
        query: {
            projectId: projectId
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: false // Don't force new connection
    });

    currentProjectId = projectId;

    // Connection event handlers
    socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
    });

    socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        currentProjectId = null;
    });

    socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
    });

    return socketInstance;
};

export const receiveMessage = (eventName, cb) => {
    if (!socketInstance) {
        console.error('Socket not initialized');
        return;
    }
    
    // Remove existing listener to prevent duplicates
    socketInstance.off(eventName, cb);
    
    // Add new listener
    socketInstance.on(eventName, cb);
    
    console.log(`Listening for ${eventName} events`);
};

export const removeListener = (eventName, cb) => {
    if (!socketInstance) return;
    
    if (cb) {
        socketInstance.off(eventName, cb);
    } else {
        socketInstance.off(eventName);
    }
    
    console.log(`Removed listener for ${eventName}`);
};

export const sendMessage = (eventName, data) => {
    if (!socketInstance) {
        console.error('Socket not initialized');
        return;
    }
    
    if (!socketInstance.connected) {
        console.error('Socket not connected');
        return;
    }
    
    console.log(`Sending ${eventName}:`, data);
    socketInstance.emit(eventName, data);
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        currentProjectId = null;
        console.log('Socket disconnected');
    }
};

export const isSocketConnected = () => {
    return socketInstance && socketInstance.connected;
};

export const getSocketInstance = () => {
    return socketInstance;
};