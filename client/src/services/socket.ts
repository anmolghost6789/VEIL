import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // In dev, connect to port 3001 if on port 3000, or use window.location origin
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = isLocalhost ? 'http://localhost:3001' : window.location.origin;

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
