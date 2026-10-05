import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { CreateRoomModal } from './pages/CreateRoomModal';
import { ChatRoom } from './pages/ChatRoom';
import { IncomingInviteScreen } from './components/IncomingInviteScreen';
import { BrutalistButton } from './components/BrutalistButton';
import { RoomData } from './types';
import { getSocket } from './services/socket';
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
  const [errorCode, setErrorCode] = useState<string>('ROOM_404');

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
      const res = await fetch(`/api/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setInviteRoomId(data.roomId);
        setInviteHostName(data.hostName || 'HOST');
        setInviteTtl(data.messageTtl || 60);
        setCurrentView('incoming_invite');
      } else {
        setErrorCode('ROOM_404');
        setCurrentView('error_404');
      }
    } catch (err) {
      console.error(err);
      setErrorCode('CONN_FAILED');
      setCurrentView('error_404');
    }
  };

  // Create Room Handler
  const handleCreateRoom = async (options: {
    username: string;
    messageTtl: number;
    roomTtlMinutes: number;
  }): Promise<string | null> => {
    const socket = getSocket();

    return new Promise((resolve) => {
      socket.emit('room:create', options, (res: any) => {
        if (res && res.success) {
          setActiveRoom(res.room);
          setCurrentUserId(res.participant.socketId);
          setCurrentUserName(res.participant.username);
          resolve(res.room.id);
        } else {
          alert('FAILED TO SPAWN ROOM: ' + (res?.error || 'UNKNOWN_ERROR'));
          resolve(null);
        }
      });
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

    socket.emit(
      'room:join_request',
      {
        roomId: inviteRoomId,
        username: guestUsername
      },
      (res: any) => {
        if (!res.success) {
          alert(`FAILED TO CONNECT: ${res.reason || 'REJECTED'}`);
          setCurrentView('landing');
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
