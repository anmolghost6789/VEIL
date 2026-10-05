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
    url: string;
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

export interface RoomData {
  id: string;
  createdAt: number;
  expiresAt: number;
  messageTtl: number;
  settings: RoomSettings;
  participants: Participant[];
  messages: EphemeralMessage[];
  whiteboardStrokes: WhiteboardStroke[];
}

export type WhiteboardTool = 'pen' | 'marker' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow' | 'text';

export interface WhiteboardStroke {
  id: string;
  tool: WhiteboardTool;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
  userId: string;
  userName: string;
}

export interface RemoteCursor {
  socketId: string;
  username: string;
  x: number;
  y: number;
  action: string;
}

export type ActiveToolView = 'chat' | 'whiteboard' | 'video' | 'voice' | 'files';
