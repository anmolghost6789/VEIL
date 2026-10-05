import { io, Socket } from 'socket.io-client';
import { p2pManager } from './p2p';

let rawSocket: Socket | null = null;

export const getServerBaseUrl = (): string => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/\/$/, '');
  }
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:3001' : window.location.origin;
};

// Unified Socket interface that transparently falls back to WebRTC P2P DataChannels on static hosts (like Vercel)
export interface UnifiedSocket {
  id: string;
  connected: boolean;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  connect: () => void;
}

let unifiedSocket: UnifiedSocket | null = null;

export const getSocket = (): UnifiedSocket => {
  if (!rawSocket) {
    const serverUrl = getServerBaseUrl();

    rawSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 4,
      reconnectionDelay: 1000,
      autoConnect: true,
      timeout: 2500
    });

    rawSocket.on('connect', () => {
      console.log(`[SOCKET_CONNECTED] Connected to server: ${rawSocket?.id}`);
    });

    rawSocket.on('connect_error', () => {
      // In serverless deployment like Vercel, this is expected
      console.log('[SOCKET_NOTICE] Operating in serverless P2P WebRTC mode.');
    });
  }

  if (!unifiedSocket) {
    unifiedSocket = {
      get id() {
        return rawSocket?.id || 'p2p_peer';
      },
      get connected() {
        return Boolean(rawSocket?.connected);
      },
      connect: () => {
        rawSocket?.connect();
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        rawSocket?.on(event, handler);
        p2pManager.on(event, handler);
      },
      off: (event: string, handler?: (...args: any[]) => void) => {
        rawSocket?.off(event, handler);
        p2pManager.off(event, handler);
      },
      emit: (event: string, ...args: any[]) => {
        if (rawSocket && rawSocket.connected) {
          rawSocket.emit(event, ...args);
        } else {
          // P2P DataChannel Fallback (for Vercel & serverless environments)
          const payload = args[0] || {};
          const callback = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;

          if (event === 'message:send') {
            const { roomId, content, type, fileData } = payload;
            const msg = p2pManager.sendMessage(roomId, content, type || 'text', 60, fileData);
            if (callback) callback({ success: true, message: msg });
          } else if (event === 'whiteboard:draw') {
            p2pManager.emit('whiteboard:draw', payload);
          } else if (event === 'whiteboard:cursor') {
            p2pManager.emit('whiteboard:cursor', payload);
          } else if (event === 'whiteboard:clear') {
            p2pManager.emit('whiteboard:cleared', payload);
          } else if (event === 'typing:start') {
            p2pManager.emit('typing:started', payload);
          } else if (event === 'typing:stop') {
            p2pManager.emit('typing:stopped', payload);
          } else if (event === 'message:save_request') {
            p2pManager.emit('message:save_request', payload);
          } else if (event === 'message:save_response') {
            if (payload?.approved) {
              p2pManager.emit('message:save_approved', payload);
            } else {
              p2pManager.emit('message:save_denied', payload);
            }
          } else if (event === 'room:join') {
            if (callback) callback({ success: true });
          } else {
            p2pManager.emit(event, payload);
          }
        }
      }
    };
  }

  return unifiedSocket;
};
