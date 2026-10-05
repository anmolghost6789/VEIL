import { Peer, DataConnection } from 'peerjs';
import { EphemeralMessage, RoomData, Participant } from '../types';

export type P2PEventHandler = (data: any) => void;

class P2PManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private listeners: Map<string, Set<P2PEventHandler>> = new Map();
  private isHost: boolean = false;
  private roomId: string = '';
  private currentUsername: string = '';
  private peerConnected: boolean = false;

  public on(event: string, handler: P2PEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  public off(event: string, handler?: P2PEventHandler) {
    if (!this.listeners.has(event)) return;
    if (handler) {
      this.listeners.get(event)!.delete(handler);
    } else {
      this.listeners.delete(event);
    }
  }

  public emit(event: string, data: any) {
    // Local dispatch
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }

    // Remote dispatch over DataChannel
    if (this.connection && this.connection.open) {
      try {
        this.connection.send({ event, data });
      } catch (err) {
        console.error('[P2P_SEND_ERR]', err);
      }
    }
  }

  // Host initializes P2P room with deterministic ID
  public async initHost(roomId: string, username: string, messageTtl: number = 60): Promise<RoomData> {
    this.roomId = roomId.toUpperCase();
    this.currentUsername = username;
    this.isHost = true;
    this.cleanup();

    const hostPeerId = `veil-${this.roomId.toLowerCase()}-host`;

    return new Promise((resolve) => {
      this.peer = new Peer(hostPeerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      const now = Date.now();
      const initialRoom: RoomData = {
        id: this.roomId,
        createdAt: now,
        expiresAt: now + 3600 * 1000,
        messageTtl,
        settings: {
          allowFiles: true,
          allowScreenShare: true,
          allowWhiteboard: true,
          allowVoice: true,
          allowVideo: true
        },
        participants: [
          {
            id: hostPeerId,
            socketId: hostPeerId,
            username: this.currentUsername || 'HOST',
            isHost: true,
            audioActive: false,
            videoActive: false,
            screenActive: false,
            joinedAt: now
          }
        ],
        messages: [],
        whiteboardStrokes: []
      };

      this.peer.on('open', (id) => {
        console.log(`[P2P_HOST_OPEN] Peer ID: ${id}`);
        resolve(initialRoom);
      });

      this.peer.on('error', (err) => {
        console.warn('[P2P_HOST_ERR]', err);
        resolve(initialRoom);
      });

      // Listen for incoming guest connection
      this.peer.on('connection', (conn) => {
        console.log(`[P2P_INCOMING_GUEST] Connected from ${conn.peer}`);
        this.setupConnection(conn);

        conn.on('open', () => {
          // Send handshake info to guest
          conn.send({
            event: 'p2p:handshake_ack',
            data: {
              hostName: this.currentUsername,
              messageTtl,
              roomId: this.roomId
            }
          });
        });
      });
    });
  }

  // Guest connects to host using room ID
  public async initGuest(roomId: string, username: string): Promise<boolean> {
    this.roomId = roomId.toUpperCase();
    this.currentUsername = username;
    this.isHost = false;
    this.cleanup();

    const hostPeerId = `veil-${this.roomId.toLowerCase()}-host`;

    return new Promise((resolve) => {
      this.peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (guestId) => {
        console.log(`[P2P_GUEST_OPEN] Guest ID: ${guestId}, connecting to: ${hostPeerId}`);
        const conn = this.peer!.connect(hostPeerId, {
          reliable: true
        });

        this.setupConnection(conn);

        conn.on('open', () => {
          console.log('[P2P_CONNECTED_TO_HOST]');
          this.peerConnected = true;
          // Send join request to host
          conn.send({
            event: 'p2p:guest_joined',
            data: {
              guestId,
              username: this.currentUsername
            }
          });
          resolve(true);
        });

        conn.on('error', (err) => {
          console.error('[P2P_CONN_ERR]', err);
          resolve(false);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('[P2P_GUEST_ERR]', err);
        resolve(false);
      });

      // Safety timeout after 4 seconds
      setTimeout(() => {
        if (!this.peerConnected) resolve(false);
      }, 4000);
    });
  }

  private setupConnection(conn: DataConnection) {
    this.connection = conn;

    conn.on('data', (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      const { event, data } = payload;

      if (event === 'p2p:guest_joined') {
        const guestParticipant: Participant = {
          id: data.guestId,
          socketId: data.guestId,
          username: data.username || 'GUEST',
          isHost: false,
          audioActive: false,
          videoActive: false,
          screenActive: false,
          joinedAt: Date.now()
        };
        // Emit to local host
        this.dispatchLocal('room:user_joined', { participant: guestParticipant });
      } else if (event === 'p2p:handshake_ack') {
        const hostParticipant: Participant = {
          id: conn.peer,
          socketId: conn.peer,
          username: data.hostName || 'HOST',
          isHost: true,
          audioActive: false,
          videoActive: false,
          screenActive: false,
          joinedAt: Date.now()
        };
        this.dispatchLocal('room:user_joined', { participant: hostParticipant });
      } else {
        // Dispatch to registered event listeners
        this.dispatchLocal(event, data);
      }
    });

    conn.on('close', () => {
      console.log('[P2P_CONN_CLOSED]');
      this.peerConnected = false;
      this.dispatchLocal('room:user_left', { socketId: conn.peer });
    });
  }

  private dispatchLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }

  public sendMessage(roomId: string, content: string, type: 'text' | 'gif' | 'file' | 'audio', ttlSeconds: number, fileData?: any): EphemeralMessage {
    const now = Date.now();
    const messageId = `msg_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const message: EphemeralMessage = {
      id: messageId,
      roomId,
      senderId: this.peer?.id || 'local',
      senderName: this.currentUsername || (this.isHost ? 'HOST' : 'GUEST'),
      content,
      type,
      fileData,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      isSaved: false
    };

    // Emit to both self and remote
    this.emit('message:new', { message });
    return message;
  }

  public cleanup() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.peerConnected = false;
  }
}

export const p2pManager = new P2PManager();
