import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getServerBaseUrl = (): string => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/\/$/, '');
  }
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:3001' : window.location.origin;
};

export const getSocket = (): Socket => {
  if (!socket) {
    const serverUrl = getServerBaseUrl();

    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log(`[SOCKET_CONNECTED] Connected with ID: ${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET_DISCONNECTED] Disconnected: ${reason}`);
    });
  }

  return socket;
};
