import { Room, Participant, EphemeralMessage, RoomSettings, WhiteboardStroke } from './types.js';
import { Server as SocketIOServer } from 'socket.io';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;

    // Background garbage collector for expired rooms and messages every 5 seconds
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 5000);
  }

  // Generate unique room ID like 8KX92LM
  public generateRoomId(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let id = '';
    do {
      id = '';
      for (let i = 0; i < 7; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(id));
    return id;
  }

  public createRoom(
    creatorSocketId: string,
    username: string,
    messageTtlSeconds: number = 60,
    roomTtlMinutes: number = 60,
    settings?: Partial<RoomSettings>
  ): { room: Room; participant: Participant } {
    const roomId = this.generateRoomId();
    const now = Date.now();

    const participant: Participant = {
      id: creatorSocketId,
      socketId: creatorSocketId,
      username: username || 'ANON_HOST',
      isHost: true,
      audioActive: false,
      videoActive: false,
      screenActive: false,
      joinedAt: now
    };

    const defaultSettings: RoomSettings = {
      allowFiles: true,
      allowScreenShare: true,
      allowWhiteboard: true,
      allowVoice: true,
      allowVideo: true,
      ...settings
    };

    const room: Room = {
      id: roomId,
      creatorId: creatorSocketId,
      createdAt: now,
      expiresAt: now + roomTtlMinutes * 60 * 1000,
      messageTtl: messageTtlSeconds,
      settings: defaultSettings,
      participants: new Map([[creatorSocketId, participant]]),
      pendingRequests: new Map(),
      messages: new Map(),
      whiteboardStrokes: []
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(creatorSocketId, roomId);

    return { room, participant };
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public requestJoin(roomId: string, socketId: string, username: string): { success: boolean; reason?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, reason: 'ROOM_NOT_FOUND' };
    }

    if (room.participants.size >= 2) {
      return { success: false, reason: 'ROOM_FULL' };
    }

    room.pendingRequests.set(socketId, {
      socketId,
      username: username || 'ANON_GUEST',
      requestedAt: Date.now()
    });

    // Notify the host
    const host = Array.from(room.participants.values()).find(p => p.isHost);
    if (host) {
      this.io.to(host.socketId).emit('room:join_request', {
        roomId,
        requesterSocketId: socketId,
        username: username || 'ANON_GUEST'
      });
    }

    return { success: true };
  }

  public joinRoomDirect(
    roomId: string,
    socketId: string,
    username: string
  ): { success: boolean; room?: any; participant?: Participant; reason?: string } {
    let room = this.rooms.get(roomId);
    if (!room) {
      // Re-create on the fly if needed
      const created = this.createRoom(socketId, username, 60, 60);
      room = created.room;
      return { success: true, room: this.serializeRoom(room), participant: created.participant };
    }

    // If socket already in room, update
    let participant = room.participants.get(socketId);
    if (participant) {
      participant.username = username || participant.username;
      return { success: true, room: this.serializeRoom(room), participant };
    }

    // Clean up any stale sockets if room claims to be full
    const activeSocketIds = Array.from(this.io.sockets.sockets.keys());
    for (const [pid] of room.participants) {
      if (!activeSocketIds.includes(pid)) {
        room.participants.delete(pid);
        this.socketToRoom.delete(pid);
      }
    }

    const newParticipant: Participant = {
      id: socketId,
      socketId,
      username: username || 'ANON_GUEST',
      isHost: room.participants.size === 0,
      audioActive: false,
      videoActive: false,
      screenActive: false,
      joinedAt: Date.now()
    };

    room.participants.set(socketId, newParticipant);
    this.socketToRoom.set(socketId, roomId);

    return {
      success: true,
      room: this.serializeRoom(room),
      participant: newParticipant
    };
  }

  public acceptJoin(roomId: string, hostSocketId: string, requesterSocketId: string): Participant | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const host = room.participants.get(hostSocketId);
    if (!host || !host.isHost) return null;

    const pending = room.pendingRequests.get(requesterSocketId);
    if (!pending) return null;

    room.pendingRequests.delete(requesterSocketId);

    const participant: Participant = {
      id: requesterSocketId,
      socketId: requesterSocketId,
      username: pending.username,
      isHost: false,
      audioActive: false,
      videoActive: false,
      screenActive: false,
      joinedAt: Date.now()
    };

    room.participants.set(requesterSocketId, participant);
    this.socketToRoom.set(requesterSocketId, roomId);

    return participant;
  }

  public declineJoin(roomId: string, hostSocketId: string, requesterSocketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const host = room.participants.get(hostSocketId);
    if (!host || !host.isHost) return false;

    room.pendingRequests.delete(requesterSocketId);
    return true;
  }

  public addMessage(
    roomId: string,
    senderSocketId: string,
    content: string,
    type: 'text' | 'gif' | 'file' | 'audio' = 'text',
    fileData?: EphemeralMessage['fileData'],
    senderNameFallback?: string,
    messageIdOverride?: string
  ): EphemeralMessage | null {
    let room = this.rooms.get(roomId);
    if (!room) {
      const created = this.createRoom(senderSocketId, senderNameFallback || 'ANON_HOST', 60, 60);
      room = created.room;
    }

    let sender = room.participants.get(senderSocketId);
    if (!sender) {
      sender = {
        id: senderSocketId,
        socketId: senderSocketId,
        username: senderNameFallback || 'PEER',
        isHost: room.participants.size === 0,
        audioActive: false,
        videoActive: false,
        screenActive: false,
        joinedAt: Date.now()
      };
      room.participants.set(senderSocketId, sender);
      this.socketToRoom.set(senderSocketId, roomId);
      this.io.to(roomId).emit('room:user_joined', {
        roomId,
        participant: sender
      });
    }

    const now = Date.now();
    const expiresAt = now + room.messageTtl * 1000;
    const messageId = messageIdOverride || `msg_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const message: EphemeralMessage = {
      id: messageId,
      roomId,
      senderId: senderSocketId,
      senderName: sender.username,
      content,
      type,
      fileData,
      createdAt: now,
      expiresAt,
      isSaved: false
    };

    room.messages.set(messageId, message);

    // Schedule eviction timer
    setTimeout(() => {
      this.evictMessageIfExpired(roomId, messageId);
    }, room.messageTtl * 1000 + 500);

    return message;
  }

  private evictMessageIfExpired(roomId: string, messageId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const message = room.messages.get(messageId);
    if (!message) return;

    // Do not evict if saved permanently by dual-consent
    if (message.isSaved) return;

    room.messages.delete(messageId);
    this.io.to(roomId).emit('message:expire', {
      roomId,
      messageId
    });
  }

  public requestSaveMessage(roomId: string, messageId: string, requesterSocketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const message = room.messages.get(messageId);
    if (!message) return false;

    const requester = room.participants.get(requesterSocketId);
    if (!requester) return false;

    message.saveConsent = {
      requestedBy: requesterSocketId,
      requestedByName: requester.username,
      approvedBy: [requesterSocketId],
      status: 'pending'
    };

    // Broadcast save request to the other participant
    for (const [socketId] of room.participants) {
      if (socketId !== requesterSocketId) {
        this.io.to(socketId).emit('message:save_request', {
          roomId,
          messageId,
          content: message.content,
          type: message.type,
          requesterName: requester.username
        });
      }
    }

    return true;
  }

  public respondSaveMessage(roomId: string, messageId: string, responderSocketId: string, approved: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const message = room.messages.get(messageId);
    if (!message || !message.saveConsent) return false;

    if (approved) {
      message.isSaved = true;
      message.saveConsent.status = 'approved';
      if (!message.saveConsent.approvedBy.includes(responderSocketId)) {
        message.saveConsent.approvedBy.push(responderSocketId);
      }

      this.io.to(roomId).emit('message:save_approved', {
        roomId,
        messageId,
        approvedByNames: Array.from(room.participants.values()).map(p => p.username)
      });
    } else {
      message.saveConsent.status = 'denied';
      this.io.to(roomId).emit('message:save_denied', {
        roomId,
        messageId
      });
    }

    return true;
  }

  public updateMessageTtl(roomId: string, socketId: string, newTtlSeconds: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const participant = room.participants.get(socketId);
    if (!participant || !participant.isHost) return false;

    room.messageTtl = newTtlSeconds;
    this.io.to(roomId).emit('room:ttl_updated', {
      roomId,
      messageTtl: newTtlSeconds
    });

    return true;
  }

  public updateSettings(roomId: string, socketId: string, newSettings: Partial<RoomSettings>): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const participant = room.participants.get(socketId);
    if (!participant || !participant.isHost) return false;

    room.settings = { ...room.settings, ...newSettings };
    this.io.to(roomId).emit('room:settings_updated', {
      roomId,
      settings: room.settings
    });

    return true;
  }

  public addWhiteboardStroke(roomId: string, stroke: WhiteboardStroke) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.whiteboardStrokes.push(stroke);
  }

  public clearWhiteboard(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.whiteboardStrokes = [];
    this.io.to(roomId).emit('whiteboard:cleared');
  }

  public updateMediaStatus(socketId: string, audio?: boolean, video?: boolean, screen?: boolean) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socketId);
    if (!participant) return;

    if (audio !== undefined) participant.audioActive = audio;
    if (video !== undefined) participant.videoActive = video;
    if (screen !== undefined) participant.screenActive = screen;

    this.io.to(roomId).emit('participant:media_updated', {
      socketId,
      audioActive: participant.audioActive,
      videoActive: participant.videoActive,
      screenActive: participant.screenActive
    });
  }

  public destroyRoom(roomId: string, socketId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    this.io.to(roomId).emit('room:destroyed', {
      roomId,
      reason: 'HOST_TERMINATED'
    });

    for (const [pid] of room.participants) {
      this.socketToRoom.delete(pid);
    }

    this.rooms.delete(roomId);
    return true;
  }

  public removeSocket(socketId: string): void {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    const departingUser = room.participants.get(socketId);
    room.participants.delete(socketId);
    room.pendingRequests.delete(socketId);

    if (departingUser) {
      this.io.to(roomId).emit('room:user_left', {
        roomId,
        socketId,
        username: departingUser.username,
        isHost: departingUser.isHost
      });
    }

    // If host left or no one is left, schedule immediate or quick destruction
    if (room.participants.size === 0 || departingUser?.isHost) {
      setTimeout(() => {
        // If room is still empty or host abandoned, destroy
        if (this.rooms.has(roomId)) {
          this.destroyRoom(roomId);
        }
      }, 10000); // 10s grace
    }
  }

  private cleanupExpiredItems() {
    const now = Date.now();

    for (const [roomId, room] of this.rooms) {
      // Check room TTL
      if (now > room.expiresAt) {
        this.destroyRoom(roomId);
        continue;
      }

      // Check messages TTL
      for (const [msgId, msg] of room.messages) {
        if (!msg.isSaved && now >= msg.expiresAt) {
          room.messages.delete(msgId);
          this.io.to(roomId).emit('message:expire', {
            roomId,
            messageId: msgId
          });
        }
      }
    }
  }

  public serializeRoom(room: Room) {
    return {
      id: room.id,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      messageTtl: room.messageTtl,
      settings: room.settings,
      participants: Array.from(room.participants.values()),
      messages: Array.from(room.messages.values()),
      whiteboardStrokes: room.whiteboardStrokes
    };
  }
}
