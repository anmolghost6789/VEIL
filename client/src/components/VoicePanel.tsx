import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Radio } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';
import { Participant } from '../types';

interface VoicePanelProps {
  roomId: string;
  participants: Participant[];
  currentUserId: string;
  onEndCall: () => void;
  onToggleMic: (enabled: boolean) => void;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({
  roomId,
  participants,
  currentUserId,
  onEndCall,
  onToggleMic
}) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleMicToggle = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    onToggleMic(next);
  };

  return (
    <div className="flex flex-col h-full w-full bg-ink p-4 sm:p-6 justify-between select-none">
      {/* Top Header */}
      <div className="border-b-2 border-offwhite/20 pb-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-acid animate-pulse" />
            <span className="font-bold text-offwhite uppercase tracking-wider">
              VOICE_LINK // ROOM_{roomId}
            </span>
          </div>
          <div className="text-acid font-bold tracking-widest">
            {formatDuration(callDuration)}
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-offwhite/50 flex items-center justify-between">
          <span>SIGNAL: ████████ GOOD</span>
          <span>CODEC: OPUS_48KHZ</span>
        </div>
      </div>

      {/* Participant Voice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {participants.map((p) => {
          const isSelf = p.socketId === currentUserId;
          return (
            <div
              key={p.socketId}
              className={`border-2 p-4 bg-ink-800 ${
                isSelf ? 'border-acid shadow-brutal-acid' : 'border-cyber shadow-brutal-cyber'
              }`}
            >
              <div className="flex items-center justify-between mb-3 font-mono">
                <span className="font-bold text-sm text-offwhite truncate">
                  {p.username} {isSelf && '(YOU)'}
                </span>
                <span className="text-[10px] text-acid font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-acid animate-ping" />
                  CONNECTED
                </span>
              </div>

              {/* Animated Audio Spectrum Waves */}
              <div className="h-16 flex items-center justify-center gap-1 bg-ink border border-ink-600 p-2">
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-acid audio-bar rounded-none"
                    style={{
                      animationDuration: `${0.6 + (i % 7) * 0.15}s`,
                      animationDelay: `${(i % 5) * 0.08}s`,
                      height: `${10 + (i % 5) * 8}px`
                    }}
                  />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-offwhite/50">
                <span>BITRATE: 64 KBPS</span>
                <span>JITTER: 2MS</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Buttons Bar */}
      <div className="border-t-2 border-offwhite/20 pt-4 flex items-center justify-center gap-3">
        <button
          onClick={handleMicToggle}
          className={`p-3 border-2 font-mono flex items-center gap-2 transition-all ${
            micEnabled
              ? 'bg-acid text-ink border-offwhite shadow-brutal-white font-bold'
              : 'bg-danger text-offwhite border-danger shadow-brutal'
          }`}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="text-xs uppercase font-bold">{micEnabled ? 'MIC ON' : 'MUTED'}</span>
        </button>

        <button
          onClick={() => setSpeakerEnabled((p) => !p)}
          className={`p-3 border-2 font-mono flex items-center gap-2 transition-all ${
            speakerEnabled
              ? 'bg-ink-800 text-offwhite border-offwhite/40 shadow-brutal hover:border-offwhite'
              : 'bg-danger/20 text-danger border-danger shadow-brutal'
          }`}
        >
          {speakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="text-xs uppercase font-bold">
            {speakerEnabled ? 'SPEAKER' : 'DEAFENED'}
          </span>
        </button>

        <BrutalistButton variant="danger" size="md" onClick={onEndCall}>
          <PhoneOff className="w-5 h-5 mr-1.5" />
          <span>END CALL</span>
        </BrutalistButton>
      </div>
    </div>
  );
};
