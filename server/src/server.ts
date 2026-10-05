import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '25mb' }));

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 25 * 1024 * 1024 // 25MB for temporary file relays
});

const roomManager = new RoomManager(io);

// Client Dist static hosting fallback
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// REST Health Check & Room Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    protocol: 'VEIL_EPHEMERAL_v1',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

app.get('/api/room/:roomId', (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  const room = roomManager.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'ROOM_NOT_FOUND', code: 'ROOM_404' });
  }

  const host = Array.from(room.participants.values()).find(p => p.isHost);

  res.json({
    roomId: room.id,
    exists: true,
    isFull: room.participants.size >= 2,
    participantCount: room.participants.size,
    hostName: host ? host.username : 'UNKNOWN',
    messageTtl: room.messageTtl,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    settings: room.settings
  });
});

// Socket.IO Realtime Engine
io.on('connection', (socket) => {
  console.log(`[NET_CONNECT] Socket connected: ${socket.id}`);

  // Create room
  socket.on('room:create', (payload, callback) => {
    try {
      const { username, messageTtl, roomTtlMinutes, settings } = payload || {};
      const { room, participant } = roomManager.createRoom(
        socket.id,
        username,
        messageTtl || 60,
        roomTtlMinutes || 60,
        settings
      );

      socket.join(room.id);

      const serialized = roomManager.serializeRoom(room);
      console.log(`[ROOM_CREATED] Room: ${room.id} by ${participant.username}`);

      if (callback) callback({ success: true, room: serialized, participant });
    } catch (err: any) {
      console.error('[ROOM_CREATE_ERROR]', err);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Direct join room or rejoin on mount
  socket.on('room:join', (payload, callback) => {
    const { roomId, username } = payload || {};
    const normRoomId = (roomId || '').toUpperCase();
    socket.join(normRoomId);
    const result = roomManager.joinRoomDirect(normRoomId, socket.id, username);

    if (result.success && result.room && result.participant) {
      io.to(normRoomId).emit('room:user_joined', {
        roomId: normRoomId,
        participant: result.participant
      });
      console.log(`[USER_JOINED_DIRECT] ${result.participant.username} in room ${normRoomId}`);
      if (callback) callback({ success: true, room: result.room, participant: result.participant });
    } else {
      if (callback) callback({ success: false, reason: result.reason });
    }
  });

  // Request to join room (host approval flow)
  socket.on('room:join_request', (payload, callback) => {
    const { roomId, username } = payload || {};
    const normRoomId = (roomId || '').toUpperCase();
    const result = roomManager.requestJoin(normRoomId, socket.id, username);

    if (callback) callback(result);
  });

  // Host accepts join request
  socket.on('room:accept', (payload) => {
    const { roomId, requesterSocketId } = payload;
    const normRoomId = (roomId || '').toUpperCase();
    const room = roomManager.getRoom(normRoomId);
    if (!room) return;

    const participant = roomManager.acceptJoin(normRoomId, socket.id, requesterSocketId);
    if (participant) {
      const targetSocket = io.sockets.sockets.get(requesterSocketId);
      if (targetSocket) {
        targetSocket.join(normRoomId);
        targetSocket.emit('room:accepted', {
          room: roomManager.serializeRoom(room),
          participant
        });
      }

      // Notify whole room
      io.to(normRoomId).emit('room:user_joined', {
        roomId: normRoomId,
        participant
      });

      console.log(`[USER_JOINED] ${participant.username} joined room ${normRoomId}`);
    }
  });

  // Host declines join request
  socket.on('room:decline', (payload) => {
    const { roomId, requesterSocketId } = payload;
    const normRoomId = (roomId || '').toUpperCase();
    const success = roomManager.declineJoin(normRoomId, socket.id, requesterSocketId);
    if (success) {
      io.to(requesterSocketId).emit('room:declined', { roomId: normRoomId });
    }
  });

  // Send message
  socket.on('message:send', (payload, callback) => {
    const { roomId, content, type, fileData, senderName } = payload;
    const normRoomId = (roomId || '').toUpperCase();
    socket.join(normRoomId); // Ensure socket is subscribed to room channel!

    const message = roomManager.addMessage(normRoomId, socket.id, content, type, fileData, senderName);

    if (message) {
      io.to(normRoomId).emit('message:new', {
        roomId: normRoomId,
        message
      });
      console.log(`[MSG_SENT] In ${normRoomId} by ${message.senderName}: "${content.substring(0, 30)}"`);
      if (callback) callback({ success: true, message });
    } else {
      if (callback) callback({ success: false, error: 'MESSAGE_SEND_FAILED' });
    }
  });

  // Dual-consent save message request
  socket.on('message:save_request', (payload) => {
    const { roomId, messageId } = payload;
    roomManager.requestSaveMessage(roomId, messageId, socket.id);
  });

  // Respond to save message request (allow/deny)
  socket.on('message:save_response', (payload) => {
    const { roomId, messageId, approved } = payload;
    roomManager.respondSaveMessage(roomId, messageId, socket.id, approved);
  });

  // Typing indicators
  socket.on('typing:start', (payload) => {
    const { roomId, username } = payload;
    socket.to(roomId).emit('typing:started', { socketId: socket.id, username });
  });

  socket.on('typing:stop', (payload) => {
    const { roomId } = payload;
    socket.to(roomId).emit('typing:stopped', { socketId: socket.id });
  });

  // Collaborative Whiteboard
  socket.on('whiteboard:draw', (payload) => {
    const { roomId, stroke } = payload;
    roomManager.addWhiteboardStroke(roomId, stroke);
    socket.to(roomId).emit('whiteboard:draw', { stroke });
  });

  socket.on('whiteboard:cursor', (payload) => {
    const { roomId, cursor } = payload;
    socket.to(roomId).emit('whiteboard:cursor', {
      cursor: {
        ...cursor,
        socketId: socket.id
      }
    });
  });

  socket.on('whiteboard:clear', (payload) => {
    const { roomId } = payload;
    roomManager.clearWhiteboard(roomId);
  });

  // WebRTC Signaling
  socket.on('call:offer', (payload) => {
    const { roomId, offer } = payload;
    socket.to(roomId).emit('call:offer', {
      offer,
      senderSocketId: socket.id
    });
  });

  socket.on('call:answer', (payload) => {
    const { roomId, answer } = payload;
    socket.to(roomId).emit('call:answer', {
      answer,
      senderSocketId: socket.id
    });
  });

  socket.on('call:ice', (payload) => {
    const { roomId, candidate } = payload;
    socket.to(roomId).emit('call:ice', {
      candidate,
      senderSocketId: socket.id
    });
  });

  socket.on('call:end', (payload) => {
    const { roomId } = payload;
    socket.to(roomId).emit('call:ended', {
      senderSocketId: socket.id
    });
  });

  // Media toggles (audio, video, screen)
  socket.on('media:toggle', (payload) => {
    const { audio, video, screen } = payload;
    roomManager.updateMediaStatus(socket.id, audio, video, screen);
  });

  // Room settings & TTL updates
  socket.on('room:update_ttl', (payload) => {
    const { roomId, messageTtl } = payload;
    roomManager.updateMessageTtl(roomId, socket.id, messageTtl);
  });

  socket.on('room:update_settings', (payload) => {
    const { roomId, settings } = payload;
    roomManager.updateSettings(roomId, socket.id, settings);
  });

  // Destroy room
  socket.on('room:destroy', (payload) => {
    const { roomId } = payload;
    roomManager.destroyRoom(roomId, socket.id);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[NET_DISCONNECT] Socket disconnected: ${socket.id}`);
    roomManager.removeSocket(socket.id);
  });
});

if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`═══════════════════════════════════════════════════════`);
  console.log(`   VEIL// UNDERGROUND REALTIME EPHEMERAL SERVER        `);
  console.log(`   STATUS: ACTIVE  |  PORT: ${PORT}                    `);
  console.log(`   PROTOCOL: WEBSOCKET + WEBRTC SIGNALING             `);
  console.log(`═══════════════════════════════════════════════════════`);
});
