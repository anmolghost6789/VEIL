import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { CreateRoomModal } from './pages/CreateRoomModal';
import { ChatRoom } from './pages/ChatRoom';
import { IncomingInviteScreen } from './components/IncomingInviteScreen';
import { BrutalistButton } from './components/BrutalistButton';
import { RoomData } from './types';
import { getSocket, getServerBaseUrl } from './services/socket';
import { ShieldAlert, Home } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    'landing' | 'incoming_invite' | 'chat_room' | 'error_404'
  >('landing');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [activeRoom, setActiveRoom] = useState<RoomData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('ANON_USER');

  // Incoming Invite info
  const [inviteRoomId, setInviteRoomId] = useState<string>('');
  const [inviteHostName, setInviteHostName] = useState<string>('HOST');
  const [inviteTtl, setInviteTtl] = useState<number>(60);
  const errorCode = 'ROOM_404';

  // Check URL params on mount
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setCurrentUserId(socket.id || '');
    });

    if (socket.connected) {
      setCurrentUserId(socket.id || '');
    }

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      verifyAndLoadRoom(roomParam.toUpperCase());
    }

    // Listener for accepted guest join
    socket.on('room:accepted', ({ room, participant }: { room: RoomData; participant: any }) => {
      setActiveRoom(room);
      setCurrentUserId(participant.socketId);
      setCurrentUserName(participant.username);
      setCurrentView('chat_room');
    });

    socket.on('room:declined', () => {
      alert('THE HOST HAS DECLINED THE CONNECTION REQUEST.');
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentView('landing');
    });

    return () => {
      socket.off('room:accepted');
      socket.off('room:declined');
    };
  }, []);

  const verifyAndLoadRoom = async (roomId: string) => {
    try {
      const baseUrl = getServerBaseUrl();
      const res = await fetch(`${baseUrl}/api/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setInviteRoomId(data.roomId);
        setInviteHostName(data.hostName || 'HOST');
        setInviteTtl(data.messageTtl || 60);
        setCurrentView('incoming_invite');
      } else {
        setInviteRoomId(roomId);
        setInviteHostName('PEER');
        setInviteTtl(60);
        setCurrentView('incoming_invite');
      }
    } catch (err) {
      console.warn(err);
      setInviteRoomId(roomId);
      setInviteHostName('PEER');
      setInviteTtl(60);
      setCurrentView('incoming_invite');
    }
  };

  // Helper to generate a fallback room ID instantly
  const generateLocalRoom = (options: {
    username: string;
    messageTtl: number;
    roomTtlMinutes: number;
  }): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < 7; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const now = Date.now();
    const localRoom: RoomData = {
      id,
      createdAt: now,
      expiresAt: now + (options.roomTtlMinutes || 60) * 60 * 1000,
      messageTtl: options.messageTtl || 60,
      settings: {
        allowFiles: true,
        allowScreenShare: true,
        allowWhiteboard: true,
        allowVoice: true,
        allowVideo: true
      },
      participants: [
        {
          id: currentUserId || 'host_user',
          socketId: currentUserId || 'host_user',
          username: options.username || 'ANON_HOST',
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

    setActiveRoom(localRoom);
    setCurrentUserName(options.username || 'ANON_HOST');
    return id;
  };

  // Create Room Handler
  const handleCreateRoom = async (options: {
    username: string;
    messageTtl: number;
    roomTtlMinutes: number;
  }): Promise<string | null> => {
    const socket = getSocket();

    return new Promise((resolve) => {
      let resolved = false;

      // 1.5s timeout: If socket is not connected or slow, create room immediately
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const id = generateLocalRoom(options);
          resolve(id);
        }
      }, 1500);

      try {
        if (socket.connected) {
          socket.emit('room:create', options, (res: any) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);

            if (res && res.success) {
              setActiveRoom(res.room);
              setCurrentUserId(res.participant.socketId);
              setCurrentUserName(res.participant.username);
              resolve(res.room.id);
            } else {
              const id = generateLocalRoom(options);
              resolve(id);
            }
          });
        } else {
          socket.connect();
          socket.emit('room:create', options, (res: any) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);

            if (res && res.success) {
              setActiveRoom(res.room);
              setCurrentUserId(res.participant.socketId);
              setCurrentUserName(res.participant.username);
              resolve(res.room.id);
            } else {
              const id = generateLocalRoom(options);
              resolve(id);
            }
          });
        }
      } catch (err) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const id = generateLocalRoom(options);
          resolve(id);
        }
      }
    });
  };

  // Host enters room after sharing
  const handleEnterRoom = (roomId: string) => {
    setShowCreateModal(false);
    window.history.pushState({}, '', `?room=${roomId}`);
    setCurrentView('chat_room');
  };

  // Guest accepts invite
  const handleGuestAccept = (guestUsername: string) => {
    const socket = getSocket();
    setCurrentUserName(guestUsername);

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const now = Date.now();
        const fallbackRoom: RoomData = {
          id: inviteRoomId,
          createdAt: now,
          expiresAt: now + 3600 * 1000,
          messageTtl: inviteTtl || 60,
          settings: {
            allowFiles: true,
            allowScreenShare: true,
            allowWhiteboard: true,
            allowVoice: true,
            allowVideo: true
          },
          participants: [
            {
              id: socket.id || 'guest',
              socketId: socket.id || 'guest',
              username: guestUsername,
              isHost: false,
              audioActive: false,
              videoActive: false,
              screenActive: false,
              joinedAt: now
            }
          ],
          messages: [],
          whiteboardStrokes: []
        };
        setActiveRoom(fallbackRoom);
        setCurrentUserId(socket.id || 'guest');
        setCurrentView('chat_room');
      }
    }, 2000);

    socket.emit(
      'room:join',
      {
        roomId: inviteRoomId,
        username: guestUsername
      },
      (res: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        if (res && res.success && res.room) {
          setActiveRoom(res.room);
          setCurrentUserId(res.participant?.socketId || socket.id || 'guest');
          setCurrentView('chat_room');
        } else {
          const now = Date.now();
          const fallbackRoom: RoomData = {
            id: inviteRoomId,
            createdAt: now,
            expiresAt: now + 3600 * 1000,
            messageTtl: inviteTtl || 60,
            settings: {
              allowFiles: true,
              allowScreenShare: true,
              allowWhiteboard: true,
              allowVoice: true,
              allowVideo: true
            },
            participants: [
              {
                id: socket.id || 'guest',
                socketId: socket.id || 'guest',
                username: guestUsername,
                isHost: false,
                audioActive: false,
                videoActive: false,
                screenActive: false,
                joinedAt: now
              }
            ],
            messages: [],
            whiteboardStrokes: []
          };
          setActiveRoom(fallbackRoom);
          setCurrentUserId(socket.id || 'guest');
          setCurrentView('chat_room');
        }
      }
    );
  };

  const handleLeaveOrDestroy = () => {
    setActiveRoom(null);
    window.history.replaceState({}, '', window.location.pathname);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-ink text-offwhite font-mono antialiased">
      {/* VIEW: LANDING */}
      {currentView === 'landing' && (
        <>
          <Landing
            onCreateClick={() => setShowCreateModal(true)}
            onJoinClick={(roomId) => verifyAndLoadRoom(roomId)}
          />
          <CreateRoomModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateRoom={handleCreateRoom}
            onEnterRoom={handleEnterRoom}
          />
        </>
      )}

      {/* VIEW: INCOMING INVITATION */}
      {currentView === 'incoming_invite' && (
        <IncomingInviteScreen
          roomId={inviteRoomId}
          hostName={inviteHostName}
          messageTtlSeconds={inviteTtl}
          onAccept={handleGuestAccept}
          onDecline={() => {
            window.history.replaceState({}, '', window.location.pathname);
            setCurrentView('landing');
          }}
        />
      )}

      {/* VIEW: CHAT ROOM */}
      {currentView === 'chat_room' && activeRoom && (
        <ChatRoom
          room={activeRoom}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onLeaveRoom={handleLeaveOrDestroy}
          onDestroyRoom={handleLeaveOrDestroy}
        />
      )}

      {/* VIEW: 404 / ERROR STATE */}
      {currentView === 'error_404' && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-ink cyber-grid">
          <div className="max-w-md w-full bg-ink-900 border-2 border-danger shadow-brutal-white p-6 font-mono text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-danger font-bold text-sm">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span>CONNECTION TERMINATED // ERROR</span>
            </div>

            <div className="p-4 bg-ink border border-danger/40 space-y-1">
              <div className="text-xl font-black text-offwhite uppercase">
                ROOM COULD NOT BE FOUND
              </div>
              <div className="text-xs text-danger font-bold">CODE: {errorCode}</div>
              <div className="text-[11px] text-offwhite/50 pt-2">
                This room may have self-destructed or expired its ephemeral retention buffer.
              </div>
            </div>

            <BrutalistButton
              variant="danger"
              size="md"
              onClick={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setCurrentView('landing');
              }}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-1.5" />
              <span>RETURN TO TERMINAL PORTAL</span>
            </BrutalistButton>
          </div>
        </div>
      )}
    </div>
  );
};
