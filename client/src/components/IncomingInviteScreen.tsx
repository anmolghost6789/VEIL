import React, { useState } from 'react';
import { Shield, Radio, Check, X, Ban, Terminal } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';
import { StatusIndicator } from './StatusIndicator';

interface IncomingInviteScreenProps {
  roomId: string;
  hostName: string;
  messageTtlSeconds: number;
  onAccept: (guestUsername: string) => void;
  onDecline: () => void;
}

export const IncomingInviteScreen: React.FC<IncomingInviteScreenProps> = ({
  roomId,
  hostName,
  messageTtlSeconds,
  onAccept,
  onDecline
}) => {
  const [guestName, setGuestName] = useState('');
  const [connectingStep, setConnectingStep] = useState<string | null>(null);

  const handleAccept = () => {
    const finalName = guestName.trim() || `PEER_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    setConnectingStep('CONNECTING...');
    setTimeout(() => {
      setConnectingStep('AUTHENTICATING...');
      setTimeout(() => {
        setConnectingStep('ROOM_ACCEPTED...');
        setTimeout(() => {
          setConnectingStep('CONNECTION_ESTABLISHED ✓');
          setTimeout(() => {
            onAccept(finalName);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-ink flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none cyber-grid">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-offwhite/20 pb-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="bg-acid text-ink font-bold px-2 py-0.5 border border-offwhite">
            VEIL//
          </div>
          <span className="text-offwhite/50 hidden sm:inline">INCOMING_SIGNAL_DETECTION</span>
        </div>
        <StatusIndicator status="syncing" label="HANDSHAKE_READY" />
      </div>

      {/* Main Center Card */}
      <div className="max-w-xl w-full mx-auto my-auto bg-ink-900 border-2 border-offwhite shadow-brutal-white p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Terminal Header tag */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-ink-600 font-mono text-xs">
          <div className="flex items-center gap-2 text-warning">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="font-bold tracking-widest">INCOMING CONNECTION REQUEST</span>
          </div>
          <span className="text-[10px] text-offwhite/40">PROTOCOL: P2P_EPHEMERAL</span>
        </div>

        {connectingStep ? (
          /* Connecting Terminal Progress */
          <div className="py-12 text-center font-mono space-y-4">
            <Terminal className="w-8 h-8 mx-auto text-acid animate-bounce" />
            <div className="text-base sm:text-lg font-bold text-acid tracking-widest">
              {connectingStep}
            </div>
            <div className="w-48 h-2 bg-ink border border-acid mx-auto overflow-hidden">
              <div className="h-full bg-acid animate-pulse w-full" />
            </div>
            <div className="text-[10px] text-offwhite/50 tracking-wider">
              ESTABLISHING VOLATILE MEMORY BUFFER
            </div>
          </div>
        ) : (
          <>
            {/* Editorial Title */}
            <div className="space-y-2 mb-6">
              <h1 className="font-display font-black text-2xl sm:text-4xl text-offwhite tracking-tight uppercase leading-none">
                {hostName} WANTS TO START A TEMPORARY ROOM WITH YOU.
              </h1>
              <p className="font-mono text-xs text-offwhite/60">
                Talk. Draw. Call. Then disappear. No accounts required. No messages saved.
              </p>
            </div>

            {/* Room Metadata Box */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-ink border border-offwhite/30 font-mono text-xs mb-6">
              <div>
                <span className="text-[10px] text-offwhite/40 block">ROOM_ID:</span>
                <span className="font-bold text-acid text-base tracking-widest">{roomId}</span>
              </div>
              <div>
                <span className="text-[10px] text-offwhite/40 block">MESSAGE RETENTION:</span>
                <span className="font-bold text-warning text-base tracking-widest">
                  {messageTtlSeconds} SECONDS
                </span>
              </div>
            </div>

            {/* Guest Handle Input */}
            <div className="mb-6 font-mono">
              <label className="block text-[11px] text-offwhite/70 mb-1.5 uppercase tracking-wider font-bold">
                YOUR DISPLAY HANDLE (OPTIONAL):
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="ENTER_NAME (DEFAULT: ANON_PEER)"
                maxLength={20}
                className="w-full bg-ink border-2 border-offwhite/40 p-2.5 text-xs text-offwhite placeholder-offwhite/30 focus:outline-none focus:border-acid"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <BrutalistButton
                variant="primary"
                size="lg"
                onClick={handleAccept}
                className="w-full sm:flex-1"
              >
                <Check className="w-5 h-5 mr-1.5" />
                <span>ACCEPT CONNECTION</span>
              </BrutalistButton>

              <BrutalistButton
                variant="dark"
                size="md"
                onClick={onDecline}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-1" />
                <span>DECLINE</span>
              </BrutalistButton>

              <button
                onClick={onDecline}
                className="text-[11px] font-mono text-offwhite/40 hover:text-danger flex items-center gap-1 uppercase tracking-wider py-1"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>BLOCK</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center font-mono text-[10px] text-offwhite/40 py-2 border-t border-ink-600 flex items-center justify-center gap-2">
        <Shield className="w-3 h-3 text-acid" />
        <span>ZERO PERSISTENT STORAGE // ALL SESSIONS EXPIRABLE UPON DISCONNECT</span>
      </div>
    </div>
  );
};
