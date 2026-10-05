import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Flame, Settings } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { toggleSound, isSoundEnabled, playMechanicalClick } from '../services/audio';

interface TerminalHeaderProps {
  roomId?: string;
  roomStatus?: 'live' | 'waiting' | 'error';
  participantCount?: number;
  remainingTtlFormatted?: string;
  onOpenSettings?: () => void;
  onDestroyRoom?: () => void;
  onHomeClick?: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  roomId,
  roomStatus = 'live',
  participantCount = 1,
  remainingTtlFormatted,
  onOpenSettings,
  onDestroyRoom,
  onHomeClick
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playMechanicalClick();
  };

  return (
    <header className="w-full bg-ink border-b-2 border-offwhite/20 select-none z-40 sticky top-0 backdrop-blur-md">
      {/* Top micro metadata ticker */}
      <div className="hidden sm:flex items-center justify-between px-4 py-0.5 bg-ink-900 border-b border-ink-600 text-[10px] font-mono tracking-widest text-offwhite/50">
        <div className="flex items-center gap-4">
          <span>BUILD_01.9</span>
          <span className="text-acid">SYS_PROTOCOL: EPHEMERAL_DISAPPEAR</span>
          <span>MEM_STORAGE: VOLATILE_RAM</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-cyber">
            <Shield className="w-3 h-3" /> ZERO_LOG_GUARANTEE
          </span>
          <span>LATENCY: &lt;14MS</span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="bg-acid text-ink font-mono font-black text-lg px-2 py-0.5 border border-offwhite shadow-brutal-white group-hover:bg-offwhite transition-colors">
            VEIL//
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-display font-black tracking-tight text-xs uppercase text-offwhite group-hover:text-acid transition-colors">
              Talk. Draw. Call. Then Disappear.
            </span>
            <span className="text-[9px] font-mono tracking-widest text-offwhite/40 uppercase">
              Underground Ephemeral Terminal
            </span>
          </div>
        </div>

        {/* Room active stats if in room */}
        {roomId ? (
          <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
            <div className="hidden sm:flex items-center gap-2 border border-offwhite/30 px-2.5 py-1 bg-ink-800">
              <span className="text-offwhite/50 text-[10px]">ROOM:</span>
              <span className="font-bold text-acid tracking-widest">{roomId}</span>
            </div>

            <div className="flex items-center gap-2 border border-offwhite/30 px-2.5 py-1 bg-ink-800">
              <StatusIndicator status={roomStatus} label={roomStatus} />
            </div>

            {remainingTtlFormatted && (
              <div className="flex items-center gap-1.5 border border-warning/40 px-2.5 py-1 bg-warning/10 text-warning">
                <span className="text-[10px] opacity-70">TTL:</span>
                <span className="font-bold tracking-wider">{remainingTtlFormatted}</span>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-1.5 border border-offwhite/30 px-2.5 py-1 bg-ink-800 text-offwhite/80">
              <span className="text-[10px] opacity-60">USERS:</span>
              <span className="font-bold text-cyber">{String(participantCount).padStart(2, '0')}/02</span>
            </div>

            <div className="hidden xl:flex items-center gap-1 border border-acid/50 px-2 py-1 bg-acid/10 text-acid font-mono text-[10px] font-bold">
              <Shield className="w-3 h-3 text-acid" />
              <span>SHIELD: ARMED</span>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-3">
            <StatusIndicator status="live" label="NETWORK_READY" />
            <div className="border border-acid/40 px-2 py-0.5 text-[10px] text-acid font-mono">
              P2P_MESH_ACTIVE
            </div>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Sound On' : 'Sound Muted'}
            className="p-1.5 border border-offwhite/30 hover:border-acid hover:text-acid text-offwhite/70 bg-ink-800 transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-danger" />}
          </button>

          {/* Settings button if in room */}
          {roomId && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Room Settings"
              className="p-1.5 border border-offwhite/30 hover:border-acid hover:text-acid text-offwhite/70 bg-ink-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Destroy Room button if inside room */}
          {roomId && onDestroyRoom && (
            <button
              onClick={onDestroyRoom}
              title="Destroy Room Now"
              className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 bg-danger/20 border border-danger text-danger hover:bg-danger hover:text-ink transition-colors font-bold uppercase"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DESTROY</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
