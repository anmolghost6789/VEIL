import React, { useRef, useEffect, useState } from 'react';
import {
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Radio,
  PenTool,
  MessageSquare
} from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';
import { webrtcService } from '../services/webrtc';
import { Participant } from '../types';

interface VideoPanelProps {
  roomId: string;
  participants: Participant[];
  currentUserId: string;
  onEndCall: () => void;
  onSwitchToChat: () => void;
  onSwitchToWhiteboard: () => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  roomId,
  participants,
  currentUserId,
  onEndCall,
  onSwitchToChat,
  onSwitchToWhiteboard
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const setupMedia = async () => {
      try {
        localStream = await webrtcService.startLocalMedia(true, true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        webrtcService.init(roomId, {
          onRemoteStream: (stream) => {
            console.log('[WEBRTC_UI] Binding remote stream');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              setHasRemoteVideo(true);
            }
          },
          onRemoteScreenStream: (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              setHasRemoteVideo(true);
            }
          },
          onConnectionStateChange: (state) => {
            console.log('[WEBRTC_UI] State:', state);
          },
          onCallEnded: () => {
            onEndCall();
          }
        });

        // Trigger call negotiation
        await webrtcService.startCall();
      } catch (err) {
        console.error('[MEDIA_INIT_FAILED]', err);
      }
    };

    setupMedia();

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      webrtcService.cleanup();
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId, onEndCall]);

  const toggleMic = () => {
    const next = !micActive;
    setMicActive(next);
    webrtcService.toggleAudio(next);
  };

  const toggleCamera = () => {
    const next = !cameraActive;
    setCameraActive(next);
    webrtcService.toggleVideo(next);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await webrtcService.startScreenShare();
        setIsScreenSharing(true);
      } catch (e) {
        setIsScreenSharing(false);
      }
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const otherParticipant = participants.find((p) => p.socketId !== currentUserId);

  return (
    <div className="flex flex-col h-full w-full bg-ink relative overflow-hidden select-none">
      {/* Top Cyber Metadata Header */}
      <div className="flex items-center justify-between p-3 bg-ink-900 border-b-2 border-offwhite/20 font-mono text-xs z-20">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-acid animate-pulse" />
          <span className="font-bold text-offwhite tracking-wider">
            VIDEO_LINK // ROOM_{roomId}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-acid font-bold">SIGNAL: GOOD ●</span>
          <span className="font-bold text-warning">{formatDuration(callDuration)}</span>
        </div>
      </div>

      {/* Screen Sharing Status Banner if active */}
      {isScreenSharing && (
        <div className="bg-cyber text-ink font-mono text-xs px-4 py-1.5 flex items-center justify-between font-bold border-b border-offwhite z-20">
          <span>SCREEN_STREAM // SOURCE: USER_DEVICE // STATUS: ACTIVE</span>
          <button
            onClick={toggleScreenShare}
            className="px-2 py-0.5 bg-ink text-cyber border border-ink text-[10px] uppercase font-bold"
          >
            STOP SHARING
          </button>
        </div>
      )}

      {/* Main Video Viewport */}
      <div className="flex-1 relative bg-ink-950 flex items-center justify-center overflow-hidden">
        {/* Remote participant video stream */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-contain ${hasRemoteVideo ? 'block' : 'hidden'}`}
        />

        {/* Fallback if remote video is not yet received */}
        {!hasRemoteVideo && (
          <div className="text-center font-mono p-6 border-2 border-dashed border-offwhite/20 max-w-sm">
            <div className="text-acid font-bold text-sm mb-2 animate-pulse">
              WAITING FOR PEER VIDEO STREAM...
            </div>
            <div className="text-offwhite/50 text-xs">
              PARTICIPANT: {otherParticipant ? otherParticipant.username : 'DISCONNECTED'}
            </div>
            <div className="text-[10px] text-offwhite/30 mt-3 font-mono">
              ENCRYPTED WebRTC PEER-TO-PEER CHANNEL
            </div>
          </div>
        )}

        {/* PIP Self-Preview (Local Stream) */}
        <div className="absolute bottom-4 right-4 w-36 sm:w-52 aspect-video bg-ink-900 border-2 border-acid shadow-brutal-acid z-30 overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          {!cameraActive && (
            <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-offwhite/40 bg-ink-950">
              CAM_MUTED
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-ink/80 text-[9px] font-mono text-acid px-1 border border-acid/40">
            YOU
          </div>
        </div>
      </div>

      {/* Bottom Floating Cyber Controls Bar */}
      <div className="p-3 bg-ink-900 border-t-2 border-offwhite/20 flex flex-wrap items-center justify-center gap-2 sm:gap-4 z-20">
        <button
          onClick={toggleMic}
          className={`p-2.5 sm:px-4 sm:py-2 border-2 font-mono text-xs flex items-center gap-1.5 transition-all ${
            micActive
              ? 'bg-ink-800 text-offwhite border-offwhite/40 hover:border-acid hover:text-acid'
              : 'bg-danger text-offwhite border-danger'
          }`}
        >
          {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{micActive ? 'MIC ON' : 'MUTED'}</span>
        </button>

        <button
          onClick={toggleCamera}
          className={`p-2.5 sm:px-4 sm:py-2 border-2 font-mono text-xs flex items-center gap-1.5 transition-all ${
            cameraActive
              ? 'bg-ink-800 text-offwhite border-offwhite/40 hover:border-acid hover:text-acid'
              : 'bg-danger text-offwhite border-danger'
          }`}
        >
          {cameraActive ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{cameraActive ? 'CAM ON' : 'CAM OFF'}</span>
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-2.5 sm:px-4 sm:py-2 border-2 font-mono text-xs flex items-center gap-1.5 transition-all ${
            isScreenSharing
              ? 'bg-cyber text-ink font-bold border-cyber'
              : 'bg-ink-800 text-offwhite border-offwhite/40 hover:border-cyber hover:text-cyber'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">{isScreenSharing ? 'SHARING' : 'SCREEN'}</span>
        </button>

        <button
          onClick={onSwitchToWhiteboard}
          className="p-2.5 sm:px-4 sm:py-2 border-2 border-offwhite/40 bg-ink-800 hover:border-acid hover:text-acid text-offwhite font-mono text-xs flex items-center gap-1.5 transition-all"
        >
          <PenTool className="w-4 h-4" />
          <span className="hidden sm:inline">WHITEBOARD</span>
        </button>

        <button
          onClick={onSwitchToChat}
          className="p-2.5 sm:px-4 sm:py-2 border-2 border-offwhite/40 bg-ink-800 hover:border-cyber hover:text-cyber text-offwhite font-mono text-xs flex items-center gap-1.5 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">CHAT</span>
        </button>

        <BrutalistButton variant="danger" size="sm" onClick={onEndCall}>
          <PhoneOff className="w-4 h-4 mr-1" />
          <span>END CALL</span>
        </BrutalistButton>
      </div>
    </div>
  );
};
