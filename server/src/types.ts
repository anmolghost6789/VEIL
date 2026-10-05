export interface Participant {
  id: string;
  socketId: string;
  username: string;
  isHost: boolean;
  audioActive: boolean;
  videoActive: boolean;
  screenActive: boolean;
  joinedAt: number;
}

export interface EphemeralMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'gif' | 'file' | 'audio' | 'system';
  fileData?: {
    name: string;
    size: number;
    type: string;
    url: string; // Base64 or Blob URL
  };
  createdAt: number;
  expiresAt: number;
  isSaved: boolean;
  saveConsent?: {
    requestedBy: string;
    requestedByName: string;
    approvedBy: string[];
    status: 'pending' | 'approved' | 'denied';
  };
}

export interface RoomSettings {
  allowFiles: boolean;
  allowScreenShare: boolean;
  allowWhiteboard: boolean;
  allowVoice: boolean;
  allowVideo: boolean;
}

export interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'marker' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow' | 'text';
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
  userId: string;
  userName: string;
}

export interface Room {
  id: string;
  creatorId: string;
  createdAt: number;
  expiresAt: number; // Overall room TTL (default 1 hour or custom)
  messageTtl: number; // in seconds (10, 30, 60, 300, 3600)
  settings: RoomSettings;
  participants: Map<string, Participant>;
  pendingRequests: Map<string, { socketId: string; username: string; requestedAt: number }>;
  messages: Map<string, EphemeralMessage>;
  whiteboardStrokes: WhiteboardStroke[];
  destructionTimer?: NodeJS.Timeout;
}
