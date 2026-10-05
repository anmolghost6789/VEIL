import React, { useState, useEffect } from 'react';
import { BrutalistButton } from '../components/BrutalistButton';
import { StatusIndicator } from '../components/StatusIndicator';
import { Lock, Radio, Terminal, ArrowRight, Zap, EyeOff, Activity } from 'lucide-react';

interface LandingProps {
  onCreateClick: () => void;
  onJoinClick: (roomId: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onCreateClick, onJoinClick }) => {
  const [joinCode, setJoinCode] = useState('');
  const [demoTtl, setDemoTtl] = useState(47);
  const [isJoinInputOpen, setIsJoinInputOpen] = useState(false);

  // Live simulation countdown on the hero terminal
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoTtl((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (clean) {
      onJoinClick(clean);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-offwhite flex flex-col justify-between relative overflow-hidden cyber-grid selection:bg-acid selection:text-ink">
      {/* Top Banner / Ticker */}
      <div className="w-full bg-ink-950 border-b border-offwhite/20 py-1.5 px-4 sm:px-8 text-[11px] font-mono tracking-widest text-offwhite/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-acid font-bold">VEIL// SYSTEM_INIT</span>
          <span className="hidden sm:inline">ZERO_LOG ARCHITECTURE</span>
          <span className="hidden md:inline text-cyber">P2P_MESH_SIGNALING</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-acid animate-ping" />
          <span className="text-offwhite font-bold">STATUS: NETWORK_ONLINE</span>
        </div>
      </div>

      {/* Main Hero Container */}
      <main className="container mx-auto px-4 sm:px-8 py-8 lg:py-16 flex-1 flex flex-col justify-center">
        {/* Technical metadata row above typography */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-6 mb-6 text-xs font-mono tracking-widest text-offwhite/50 border-b border-ink-600 pb-3">
          <span className="text-acid font-bold">BUILD_01.9</span>
          <span>EPHEMERAL_PROTOCOL</span>
          <span className="text-cyber">ENCRYPTION: ACTIVE</span>
          <span className="text-warning">MESSAGES: TEMPORARY</span>
          <span>VOICE: READY</span>
          <span>VIDEO: READY</span>
        </div>

        {/* Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Oversized Editorial Typography & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <div className="font-mono text-xs sm:text-sm text-acid uppercase font-bold tracking-widest flex items-center gap-2">
                <span className="bg-acid text-ink px-1.5 py-0.5">NEW</span>
                <span>VOLATILE RAM COMMUNICATION TERMINAL</span>
              </div>
              <h1 className="font-display font-black text-5xl sm:text-7xl xl:text-8xl tracking-tighter uppercase leading-[0.88] text-offwhite select-none">
                TEMPORARY<br />
                COMMUNICATION<br />
                <span className="text-acid underline decoration-4 underline-offset-8">
                  ROOMS
                </span>
              </h1>
            </div>

            <p className="font-mono text-base sm:text-xl text-offwhite/80 max-w-lg leading-relaxed border-l-2 border-acid pl-4">
              Talk. Draw. Call. Then disappear.
              <br />
              <span className="text-offwhite/50 text-sm">
                Temporary communication for people who don&apos;t need a chat history.
              </span>
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <BrutalistButton
                variant="primary"
                size="lg"
                onClick={onCreateClick}
                techLabel="SPAWN_ROOM"
                className="text-base sm:text-lg"
              >
                <span>CREATE TEMPORARY ROOM</span>
                <Zap className="w-5 h-5 ml-2 fill-current" />
              </BrutalistButton>

              {!isJoinInputOpen ? (
                <BrutalistButton
                  variant="dark"
                  size="lg"
                  onClick={() => setIsJoinInputOpen(true)}
                  techLabel="CONNECT"
                  className="text-base sm:text-lg"
                >
                  <span>JOIN WITH LINK</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </BrutalistButton>
              ) : (
                <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ENTER ROOM ID (e.g. 8KX92LM)"
                    maxLength={10}
                    autoFocus
                    className="bg-ink border-2 border-acid px-3 py-3 text-xs sm:text-sm font-mono text-offwhite uppercase tracking-wider focus:outline-none"
                  />
                  <BrutalistButton variant="cyber" size="md" type="submit">
                    JOIN
                  </BrutalistButton>
                </form>
              )}
            </div>

            {/* Feature Bullets / Mini Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono text-[11px] text-offwhite/70">
              <div className="p-2 border border-offwhite/20 bg-ink-900 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-acid" />
                <span>ZERO LOGS</span>
              </div>
              <div className="p-2 border border-offwhite/20 bg-ink-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyber" />
                <span>DUAL CONSENT</span>
              </div>
              <div className="p-2 border border-offwhite/20 bg-ink-900 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-magenta" />
                <span>P2P WebRTC</span>
              </div>
              <div className="p-2 border border-offwhite/20 bg-ink-900 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-warning" />
                <span>SYNC CANVAS</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Terminal Preview (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-ink-900 border-2 border-offwhite shadow-brutal-white p-4 sm:p-6 font-mono text-xs select-none relative group">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-ink-600">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-acid" />
                  <span className="font-bold text-offwhite uppercase tracking-wider">
                    TERMINAL_NODE // PREVIEW
                  </span>
                </div>
                <StatusIndicator status="live" label="ACTIVE" />
              </div>

              {/* Room Live Metadata Box */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-2 bg-ink border border-offwhite/20">
                  <span className="text-offwhite/50 text-[10px]">ROOM_ID:</span>
                  <span className="font-bold text-acid text-sm tracking-widest">8KX92LM</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-ink border border-offwhite/20">
                  <span className="text-offwhite/50 text-[10px]">STATUS:</span>
                  <span className="font-bold text-warning flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-warning rounded-full animate-ping" />
                    WAITING FOR PEER...
                  </span>
                </div>

                <div className="p-2 bg-ink border border-offwhite/20 space-y-1">
                  <span className="text-offwhite/50 text-[10px] block">INVITATION LINK:</span>
                  <span className="text-cyber text-[11px] font-bold break-all block">
                    temp.app/c/8KX92LM
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-ink border border-offwhite/20">
                  <span className="text-offwhite/50 text-[10px]">TTL COUNTDOWN:</span>
                  <span className="font-bold text-acid tracking-wider">
                    00:{String(demoTtl).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Simulated Terminal Messages */}
              <div className="space-y-2 border-t border-ink-600 pt-3 text-[11px]">
                <div className="p-2 border border-offwhite/30 bg-ink">
                  <div className="text-[9px] text-acid font-bold mb-1">SYSTEM // PROTOCOL</div>
                  <div className="text-offwhite">ENCRYPTED SOCKET LINK ESTABLISHED.</div>
                </div>

                <div className="p-2 border border-cyber/50 bg-ink text-offwhite flex justify-between items-center">
                  <span>ANMOL: hey, joining whiteboard?</span>
                  <span className="text-warning text-[9px] font-bold">TTL 00:{demoTtl}</span>
                </div>

                <div className="p-2 border border-magenta/40 bg-ink-950 text-magenta font-mono text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-magenta rounded-full" />
                  <span>PREVIOUS MESSAGE EXPUNGED [████████]</span>
                </div>
              </div>

              {/* Quick Launch CTA inside terminal */}
              <div className="mt-4 pt-3 border-t border-ink-600">
                <button
                  onClick={onCreateClick}
                  className="w-full py-2 bg-acid text-ink font-bold border border-offwhite hover:bg-offwhite transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>INITIALIZE DEMO ROOM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Editorial Footer */}
      <footer className="w-full bg-ink border-t-2 border-offwhite/20 py-4 px-4 sm:px-8 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-offwhite/50">
        <div className="flex items-center gap-2">
          <span className="text-offwhite font-bold">VEIL//</span>
          <span>&mdash;</span>
          <span className="uppercase text-[10px]">
            TALK. DRAW. CALL. THEN DISAPPEAR.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span>RAM_ONLY: TRUE</span>
          <span>TRACKING_SCRIPTS: 0</span>
          <span>NO_DATABASE_CHAT_LOGS</span>
        </div>
      </footer>
    </div>
  );
};
