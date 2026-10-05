import React from 'react';
import { Participant } from '../types';
import { Mic, MicOff, Video, VideoOff, Wifi } from 'lucide-react';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId
}) => {
  return (
    <div className="space-y-3 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-ink-600 pb-1.5 text-offwhite/50 text-[10px] tracking-widest uppercase">
        <span>PARTICIPANTS ({String(participants.length).padStart(2, '0')}/02)</span>
        <span className="flex items-center gap-1 text-acid">
          <Wifi className="w-3 h-3" /> P2P_SYNC
        </span>
      </div>

      <div className="space-y-2">
        {participants.map((p) => {
          const isSelf = p.socketId === currentUserId;
          return (
            <div
              key={p.socketId}
              className={`p-2.5 border-2 flex items-center justify-between transition-all ${
                isSelf
                  ? 'border-acid bg-ink-800 text-offwhite shadow-brutal-acid'
                  : 'border-offwhite/40 bg-ink-900 text-offwhite shadow-brutal'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-acid animate-ping" />
                <div className="truncate font-bold tracking-wider">
                  {p.username}
                  {isSelf && <span className="text-acid ml-1 text-[10px]">(YOU)</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-offwhite/60">
                {p.isHost && (
                  <span
                    title="Room Host"
                    className="p-0.5 bg-warning/20 border border-warning text-warning text-[9px] font-bold px-1"
                  >
                    HOST
                  </span>
                )}
                {p.audioActive ? (
                  <Mic className="w-3 h-3 text-acid" />
                ) : (
                  <MicOff className="w-3 h-3 text-offwhite/30" />
                )}
                {p.videoActive ? (
                  <Video className="w-3 h-3 text-cyber" />
                ) : (
                  <VideoOff className="w-3 h-3 text-offwhite/30" />
                )}
              </div>
            </div>
          );
        })}

        {participants.length < 2 && (
          <div className="p-3 border-2 border-dashed border-offwhite/20 text-center font-mono text-[11px] text-offwhite/40">
            WAITING_FOR_PARTICIPANT_02...
          </div>
        )}
      </div>
    </div>
  );
};
