import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  PenTool,
  Video as VideoIcon,
  Mic,
  FolderDown,
  Settings,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import {
  RoomData,
  EphemeralMessage,
  ActiveToolView,
  RoomSettings
} from '../types';
import { TerminalHeader } from '../components/TerminalHeader';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { Whiteboard } from '../components/Whiteboard';
import { VideoPanel } from '../components/VideoPanel';
import { VoicePanel } from '../components/VoicePanel';
import { ParticipantList } from '../components/ParticipantList';
import { PrivacyStatus } from '../components/PrivacyStatus';
import { ConsentModal } from '../components/ConsentModal';
import { JoinRequestModal } from '../components/JoinRequestModal';
import { RoomSettingsModal } from '../components/RoomSettingsModal';
import { QrCodeModal } from '../components/QrCodeModal';
import { StatusIndicator } from '../components/StatusIndicator';
import { BrutalistButton } from '../components/BrutalistButton';
import { getSocket } from '../services/socket';
import { playMessageReceive, playAlertChime } from '../services/audio';

interface ChatRoomProps {
  room: RoomData;
  currentUserId: string;
  currentUserName: string;
  onLeaveRoom: () => void;
  onDestroyRoom: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  room: initialRoom,
  currentUserId,
  currentUserName,
  onLeaveRoom,
  onDestroyRoom
}) => {
  const [room, setRoom] = useState<RoomData>(initialRoom);
  const [activeTool, setActiveTool] = useState<ActiveToolView>('chat');
  const [messages, setMessages] = useState<EphemeralMessage[]>(initialRoom.messages || []);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Modals & Panels
  const [showSettings, setShowSettings] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dual-Consent Save Request State
  const [activeSaveRequest, setActiveSaveRequest] = useState<{
    messageId: string;
    content: string;
    type: string;
    requesterName: string;
  } | null>(null);

  // Incoming Guest Request for Host
  const [incomingJoinRequest, setIncomingJoinRequest] = useState<{
    requesterSocketId: string;
    username: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isHost = room.participants.find((p) => p.socketId === currentUserId)?.isHost || false;

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTool]);

  // Socket Events
  useEffect(() => {
    const socket = getSocket();

    // New Message
    const handleNewMessage = ({ message }: { message: EphemeralMessage }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      if (message.senderId !== currentUserId) {
        playMessageReceive();
      }
    };

    // Expire message
    const handleMessageExpire = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    // Save message request (received by peer)
    const handleSaveRequest = (data: {
      messageId: string;
      content: string;
      type: string;
      requesterName: string;
    }) => {
      playAlertChime();
      setActiveSaveRequest(data);
    };

    // Save message approved
    const handleSaveApproved = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isSaved: true } : m))
      );
      setActiveSaveRequest(null);
    };

    // Save message denied
    const handleSaveDenied = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, saveConsent: { ...(m.saveConsent || {}), status: 'denied' } as any }
            : m
        )
      );
      setActiveSaveRequest(null);
    };

    // User joined
    const handleUserJoined = ({ participant }: { participant: any }) => {
      setRoom((prev) => ({
        ...prev,
        participants: [...prev.participants.filter((p) => p.socketId !== participant.socketId), participant]
      }));
      setIncomingJoinRequest(null);
      playAlertChime();
    };

    // User left
    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      setRoom((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.socketId !== socketId)
      }));
    };

    // Join request (for host)
    const handleJoinRequest = (data: { requesterSocketId: string; username: string }) => {
      playAlertChime();
      setIncomingJoinRequest(data);
    };

    // Typing indicators
    const handleTypingStart = ({ username }: { username: string }) => {
      setTypingUser(username);
    };

    const handleTypingStop = () => {
      setTypingUser(null);
    };

    // TTL updated
    const handleTtlUpdated = ({ messageTtl }: { messageTtl: number }) => {
      setRoom((prev) => ({ ...prev, messageTtl }));
    };

    // Settings updated
    const handleSettingsUpdated = ({ settings }: { settings: RoomSettings }) => {
      setRoom((prev) => ({ ...prev, settings }));
    };

    // Room destroyed
    const handleRoomDestroyed = () => {
      alert('THIS ROOM HAS BEEN DESTROYED. ALL EPHEMERAL DATA WIPED.');
      onDestroyRoom();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:expire', handleMessageExpire);
    socket.on('message:save_request', handleSaveRequest);
    socket.on('message:save_approved', handleSaveApproved);
    socket.on('message:save_denied', handleSaveDenied);
    socket.on('room:user_joined', handleUserJoined);
    socket.on('room:user_left', handleUserLeft);
    socket.on('room:join_request', handleJoinRequest);
    socket.on('typing:started', handleTypingStart);
    socket.on('typing:stopped', handleTypingStop);
    socket.on('room:ttl_updated', handleTtlUpdated);
    socket.on('room:settings_updated', handleSettingsUpdated);
    socket.on('room:destroyed', handleRoomDestroyed);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:expire', handleMessageExpire);
      socket.off('message:save_request', handleSaveRequest);
      socket.off('message:save_approved', handleSaveApproved);
      socket.off('message:save_denied', handleSaveDenied);
      socket.off('room:user_joined', handleUserJoined);
      socket.off('room:user_left', handleUserLeft);
      socket.off('room:join_request', handleJoinRequest);
      socket.off('typing:started', handleTypingStart);
      socket.off('typing:stopped', handleTypingStop);
      socket.off('room:ttl_updated', handleTtlUpdated);
      socket.off('room:settings_updated', handleSettingsUpdated);
      socket.off('room:destroyed', handleRoomDestroyed);
    };
  }, [currentUserId, onDestroyRoom]);

  // Actions
  const handleSendMessage = (
    content: string,
    type: 'text' | 'gif' | 'file' | 'audio' = 'text',
    fileData?: any
  ) => {
    getSocket().emit('message:send', {
      roomId: room.id,
      content,
      type,
      fileData
    });
  };

  const handleTypingStart = () => {
    getSocket().emit('typing:start', {
      roomId: room.id,
      username: currentUserName
    });
  };

  const handleTypingStop = () => {
    getSocket().emit('typing:stop', {
      roomId: room.id
    });
  };

  const handleSaveRequest = (messageId: string) => {
    getSocket().emit('message:save_request', {
      roomId: room.id,
      messageId
    });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, saveConsent: { requestedBy: currentUserId, requestedByName: currentUserName, approvedBy: [currentUserId], status: 'pending' } }
          : m
      )
    );
  };

  const handleSaveResponse = (approved: boolean) => {
    if (!activeSaveRequest) return;
    getSocket().emit('message:save_response', {
      roomId: room.id,
      messageId: activeSaveRequest.messageId,
      approved
    });
    setActiveSaveRequest(null);
  };

  const handleAcceptJoin = () => {
    if (!incomingJoinRequest) return;
    getSocket().emit('room:accept', {
      roomId: room.id,
      requesterSocketId: incomingJoinRequest.requesterSocketId
    });
    setIncomingJoinRequest(null);
  };

  const handleDeclineJoin = () => {
    if (!incomingJoinRequest) return;
    getSocket().emit('room:decline', {
      roomId: room.id,
      requesterSocketId: incomingJoinRequest.requesterSocketId
    });
    setIncomingJoinRequest(null);
  };

  const handleUpdateTtl = (newTtl: number) => {
    getSocket().emit('room:update_ttl', {
      roomId: room.id,
      messageTtl: newTtl
    });
  };

  const handleUpdateSettings = (newSettings: Partial<RoomSettings>) => {
    getSocket().emit('room:update_settings', {
      roomId: room.id,
      settings: newSettings
    });
  };

  const handleDestroyRoom = () => {
    if (window.confirm('WARNING: PERMANENTLY DESTROY ROOM AND TERMINATE ALL CONNECTIONS?')) {
      getSocket().emit('room:destroy', { roomId: room.id });
      onDestroyRoom();
    }
  };

  const inviteUrl = `${window.location.origin}?room=${room.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Files tab messages
  const fileMessages = messages.filter((m) => m.type === 'file' && m.fileData);

  return (
    <div className="flex flex-col h-screen w-full bg-ink text-offwhite overflow-hidden selection:bg-acid selection:text-ink">
      {/* Top Terminal Header */}
      <TerminalHeader
        roomId={room.id}
        roomStatus={room.participants.length >= 2 ? 'live' : 'waiting'}
        participantCount={room.participants.length}
        remainingTtlFormatted={`TTL ${String(Math.floor(room.messageTtl / 60)).padStart(2, '0')}:${String(
          room.messageTtl % 60
        ).padStart(2, '0')}`}
        onOpenSettings={() => setShowSettings(true)}
        onDestroyRoom={handleDestroyRoom}
        onHomeClick={onLeaveRoom}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR (Desktop) */}
        <aside className="hidden lg:flex w-72 flex-col justify-between border-r-2 border-offwhite/20 bg-ink-950 p-4 select-none overflow-y-auto">
          <div className="space-y-6">
            {/* Room Information Block */}
            <div className="border-2 border-offwhite/30 bg-ink-900 p-3 font-mono space-y-2.5">
              <div className="flex justify-between items-center border-b border-ink-600 pb-1.5">
                <span className="text-offwhite/50 text-[10px] tracking-widest uppercase">
                  ROOM_INFORMATION
                </span>
                <StatusIndicator
                  status={room.participants.length >= 2 ? 'live' : 'waiting'}
                  label={room.participants.length >= 2 ? 'LIVE' : 'WAITING'}
                />
              </div>

              <div>
                <span className="text-[10px] text-offwhite/40 block">ROOM_ID</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-acid tracking-widest">{room.id}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={handleCopyLink}
                      title="Copy Link"
                      className="p-1 border border-ink-600 hover:border-acid text-offwhite/70 hover:text-acid"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setShowQr(true)}
                      title="Show QR Code"
                      className="p-1 border border-ink-600 hover:border-cyber text-offwhite/70 hover:text-cyber"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-ink-700">
                <div>
                  <span className="text-[9px] text-offwhite/40 block">MSG_TTL</span>
                  <span className="font-bold text-warning">{room.messageTtl}s</span>
                </div>
                <div>
                  <span className="text-[9px] text-offwhite/40 block">USERS</span>
                  <span className="font-bold text-cyber">
                    {String(room.participants.length).padStart(2, '0')}/02
                  </span>
                </div>
              </div>
            </div>

            {/* Participants Component */}
            <ParticipantList
              participants={room.participants}
              currentUserId={currentUserId}
            />

            {/* Tool Switcher Buttons */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-offwhite/50 tracking-widest uppercase mb-1">
                COMMUNICATION_TOOLS
              </div>

              <button
                onClick={() => setActiveTool('chat')}
                className={`w-full p-2 border-2 flex items-center justify-between transition-all ${
                  activeTool === 'chat'
                    ? 'bg-acid text-ink font-bold border-offwhite shadow-brutal-white'
                    : 'bg-ink-800 text-offwhite border-ink-600 hover:border-offwhite'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>CHAT</span>
                </div>
                <span className="text-[10px] opacity-70">[{messages.length}]</span>
              </button>

              <button
                onClick={() => setActiveTool('whiteboard')}
                className={`w-full p-2 border-2 flex items-center justify-between transition-all ${
                  activeTool === 'whiteboard'
                    ? 'bg-acid text-ink font-bold border-offwhite shadow-brutal-white'
                    : 'bg-ink-800 text-offwhite border-ink-600 hover:border-offwhite'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  <span>WHITEBOARD</span>
                </div>
                <span className="text-[10px] text-cyan-400">P2P</span>
              </button>

              <button
                onClick={() => setActiveTool('video')}
                className={`w-full p-2 border-2 flex items-center justify-between transition-all ${
                  activeTool === 'video'
                    ? 'bg-acid text-ink font-bold border-offwhite shadow-brutal-white'
                    : 'bg-ink-800 text-offwhite border-ink-600 hover:border-offwhite'
                }`}
              >
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-4 h-4" />
                  <span>VIDEO</span>
                </div>
                <span className="text-[10px] text-magenta">WebRTC</span>
              </button>

              <button
                onClick={() => setActiveTool('voice')}
                className={`w-full p-2 border-2 flex items-center justify-between transition-all ${
                  activeTool === 'voice'
                    ? 'bg-acid text-ink font-bold border-offwhite shadow-brutal-white'
                    : 'bg-ink-800 text-offwhite border-ink-600 hover:border-offwhite'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span>VOICE</span>
                </div>
                <span className="text-[10px] text-warning">AUDIO</span>
              </button>

              <button
                onClick={() => setActiveTool('files')}
                className={`w-full p-2 border-2 flex items-center justify-between transition-all ${
                  activeTool === 'files'
                    ? 'bg-acid text-ink font-bold border-offwhite shadow-brutal-white'
                    : 'bg-ink-800 text-offwhite border-ink-600 hover:border-offwhite'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderDown className="w-4 h-4" />
                  <span>FILES</span>
                </div>
                <span className="text-[10px] opacity-70">[{fileMessages.length}]</span>
              </button>
            </div>
          </div>

          {/* Privacy Status Card & Settings trigger at bottom */}
          <div className="space-y-3 pt-4 border-t border-ink-700">
            <PrivacyStatus />

            <button
              onClick={() => setShowSettings(true)}
              className="w-full py-1.5 px-2 border border-offwhite/30 text-offwhite/70 hover:border-acid hover:text-acid font-mono text-xs flex items-center justify-center gap-2 bg-ink-900 transition-colors uppercase"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ROOM_SETTINGS</span>
            </button>
          </div>
        </aside>

        {/* RIGHT / MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col h-full bg-ink relative overflow-hidden">
          {/* VIEW 1: CHAT */}
          {activeTool === 'chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Message scroll area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
                {/* Empty State / Welcome Terminal notice */}
                {messages.length === 0 && (
                  <div className="max-w-md mx-auto my-12 border-2 border-offwhite/30 bg-ink-900 p-6 text-center font-mono">
                    <div className="text-acid font-bold text-sm mb-2 uppercase tracking-widest">
                      VEIL// ROOM INITIALIZED
                    </div>
                    <p className="text-xs text-offwhite/70 mb-4 leading-relaxed">
                      TALK. DRAW. CALL. THEN DISAPPEAR.
                      <br />
                      Messages automatically expunge upon expiration ({room.messageTtl} seconds).
                    </p>
                    <div className="p-2.5 bg-ink border border-offwhite/20 text-[11px] text-offwhite/60 mb-4">
                      ROOM_ID: <span className="font-bold text-acid">{room.id}</span>
                    </div>
                    <BrutalistButton variant="primary" size="sm" onClick={handleCopyLink}>
                      {copiedLink ? 'COPIED ✓' : 'COPY INVITATION LINK'}
                    </BrutalistButton>
                    <div className="mt-4 pt-3 border-t border-ink-700 text-[10px] text-offwhite/40">
                      SYSTEM READY // WAITING FOR INPUT_
                    </div>
                  </div>
                )}

                {/* Message bubbles list */}
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isSelf={msg.senderId === currentUserId}
                    onSaveRequest={handleSaveRequest}
                    onExpired={(msgId) => {
                      setMessages((prev) => prev.filter((m) => m.id !== msgId));
                    }}
                  />
                ))}

                {/* Typing Indicator */}
                {typingUser && (
                  <div className="font-mono text-xs text-acid animate-pulse flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 bg-acid rounded-full" />
                    <span>{typingUser} IS TYPING_</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <MessageComposer
                onSendMessage={handleSendMessage}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                onOpenWhiteboard={() => setActiveTool('whiteboard')}
              />
            </div>
          )}

          {/* VIEW 2: COLLABORATIVE WHITEBOARD */}
          {activeTool === 'whiteboard' && (
            <Whiteboard
              roomId={room.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          )}

          {/* VIEW 3: VIDEO CALL */}
          {activeTool === 'video' && (
            <VideoPanel
              roomId={room.id}
              participants={room.participants}
              currentUserId={currentUserId}
              onEndCall={() => setActiveTool('chat')}
              onSwitchToChat={() => setActiveTool('chat')}
              onSwitchToWhiteboard={() => setActiveTool('whiteboard')}
            />
          )}

          {/* VIEW 4: VOICE CALL */}
          {activeTool === 'voice' && (
            <VoicePanel
              roomId={room.id}
              participants={room.participants}
              currentUserId={currentUserId}
              onEndCall={() => setActiveTool('chat')}
              onToggleMic={(micOn) => {
                getSocket().emit('media:toggle', { audio: micOn });
              }}
            />
          )}

          {/* VIEW 5: FILES LIST */}
          {activeTool === 'files' && (
            <div className="flex-1 flex flex-col p-4 sm:p-8 bg-ink overflow-y-auto">
              <div className="max-w-2xl w-full mx-auto space-y-4 font-mono">
                <div className="border-b-2 border-offwhite/20 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderDown className="w-5 h-5 text-cyber" />
                    <span className="text-base font-bold text-offwhite uppercase tracking-wider">
                      EPHEMERAL_FILE_VAULT
                    </span>
                  </div>
                  <span className="text-xs text-offwhite/50">
                    BUFFER COUNT: {fileMessages.length}
                  </span>
                </div>

                {fileMessages.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-offwhite/20 text-center text-xs text-offwhite/40">
                    NO ACTIVE FILES IN VOLATILE BUFFER
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fileMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 border-2 border-offwhite/40 bg-ink-900 flex items-center justify-between shadow-brutal"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-offwhite truncate">
                            {msg.fileData?.name}
                          </div>
                          <div className="text-[10px] text-offwhite/50 flex items-center gap-3 mt-1">
                            <span>SENDER: {msg.senderName}</span>
                            <span>
                              SIZE: {((msg.fileData?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                            </span>
                            <span className="text-warning">
                              TTL: {Math.max(0, Math.floor((msg.expiresAt - Date.now()) / 1000))}s
                            </span>
                          </div>
                        </div>
                        <a
                          href={msg.fileData?.url}
                          download={msg.fileData?.name}
                          className="px-3 py-1.5 bg-cyber text-ink font-bold border border-offwhite hover:bg-offwhite text-xs transition-colors ml-3"
                        >
                          DOWNLOAD
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden flex items-center justify-around border-t-2 border-offwhite/20 bg-ink-950 p-2 font-mono text-xs z-30">
        <button
          onClick={() => setActiveTool('chat')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            activeTool === 'chat' ? 'text-acid font-bold' : 'text-offwhite/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px]">CHAT</span>
        </button>

        <button
          onClick={() => setActiveTool('whiteboard')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            activeTool === 'whiteboard' ? 'text-acid font-bold' : 'text-offwhite/60'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span className="text-[10px]">BOARD</span>
        </button>

        <button
          onClick={() => setActiveTool('video')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            activeTool === 'video' ? 'text-acid font-bold' : 'text-offwhite/60'
          }`}
        >
          <VideoIcon className="w-4 h-4" />
          <span className="text-[10px]">CALL</span>
        </button>

        <button
          onClick={() => setActiveTool('files')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            activeTool === 'files' ? 'text-acid font-bold' : 'text-offwhite/60'
          }`}
        >
          <FolderDown className="w-4 h-4" />
          <span className="text-[10px]">FILES</span>
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="flex flex-col items-center gap-1 p-1.5 text-offwhite/60 hover:text-acid"
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px]">TOOLS</span>
        </button>
      </nav>

      {/* MODALS */}
      {/* 1. Dual-Consent Save Request Modal */}
      {activeSaveRequest && (
        <ConsentModal
          requesterName={activeSaveRequest.requesterName}
          messageContent={activeSaveRequest.content}
          messageType={activeSaveRequest.type}
          onAllow={() => handleSaveResponse(true)}
          onDeny={() => handleSaveResponse(false)}
        />
      )}

      {/* 2. Incoming Guest Join Request for Host */}
      {incomingJoinRequest && (
        <JoinRequestModal
          requesterName={incomingJoinRequest.username}
          roomId={room.id}
          onAccept={handleAcceptJoin}
          onDecline={handleDeclineJoin}
        />
      )}

      {/* 3. Room Settings Modal */}
      {showSettings && (
        <RoomSettingsModal
          currentTtl={room.messageTtl}
          settings={room.settings}
          isHost={isHost}
          onUpdateTtl={handleUpdateTtl}
          onUpdateSettings={handleUpdateSettings}
          onDestroyRoom={handleDestroyRoom}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 4. QR Code Share Modal */}
      {showQr && (
        <QrCodeModal roomId={room.id} onClose={() => setShowQr(false)} />
      )}
    </div>
  );
};
