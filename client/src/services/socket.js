import io from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
    if (!socket?.connect) return socket;

    socket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export default socket;