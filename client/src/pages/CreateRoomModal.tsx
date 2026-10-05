import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { BrutalistButton } from '../components/BrutalistButton';
import { QrCodeModal } from '../components/QrCodeModal';
import { StatusIndicator } from '../components/StatusIndicator';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (options: {
    username: string;
    messageTtl: number;
    roomTtlMinutes: number;
  }) => Promise<string | null>; // Returns created roomId
  onEnterRoom: (roomId: string) => void;
}

const TTL_OPTIONS = [
  { label: '10 SEC', value: 10 },
  { label: '30 SEC', value: 30 },
  { label: '1 MIN', value: 60, default: true },
  { label: '5 MIN', value: 300 },
  { label: '1 HOUR', value: 3600 }
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onEnterRoom
}) => {
  const [username, setUsername] = useState('ANON_HOST');
  const [selectedTtl, setSelectedTtl] = useState<number>(60);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const roomId = await onCreateRoom({
        username: username.trim() || 'ANON_HOST',
        messageTtl: selectedTtl,
        roomTtlMinutes: 60
      });
      if (roomId) {
        setCreatedRoomId(roomId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteUrl = createdRoomId ? `${window.location.origin}?room=${createdRoomId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VEIL// Ephemeral Room',
          text: `Join my ephemeral room on VEIL//: ${inviteUrl}`,
          url: inviteUrl
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-ink-900 border-2 border-offwhite shadow-brutal-white p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-ink-600 font-mono text-xs">
          <div className="flex items-center gap-2 text-acid font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-current" />
            <span>{createdRoomId ? 'ROOM_INITIALIZED' : 'CREATE_TEMPORARY_ROOM'}</span>
          </div>
          <button onClick={onClose} className="text-offwhite/60 hover:text-danger p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!createdRoomId ? (
          /* Step 1: Configuration Form */
          <div className="space-y-5 font-mono">
            {/* Host Handle */}
            <div>
              <label className="block text-[11px] text-offwhite/70 mb-1.5 uppercase tracking-wider font-bold">
                YOUR CODENAME / HANDLE:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ANON_HOST"
                maxLength={20}
                className="w-full bg-ink border-2 border-offwhite/40 p-2.5 text-xs text-offwhite focus:outline-none focus:border-acid"
              />
            </div>

            {/* Message Expiration TTL */}
            <div>
              <label className="block text-[11px] text-offwhite/70 mb-1.5 uppercase tracking-wider font-bold">
                MESSAGE EXPIRATION (AUTO-DESTRUCTION TTL):
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {TTL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedTtl(opt.value)}
                    className={`py-2 text-[11px] font-bold border transition-all ${
                      selectedTtl === opt.value
                        ? 'bg-acid text-ink border-acid shadow-brutal-white'
                        : 'bg-ink-800 text-offwhite/70 border-ink-600 hover:border-offwhite'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-offwhite/40 mt-1 italic">
                * All messages expunge from server memory upon timer expiry.
              </div>
            </div>

            {/* Security Guarantee Badge */}
            <div className="p-3 bg-ink border border-offwhite/20 flex items-start gap-2.5 text-[11px] text-offwhite/70">
              <ShieldCheck className="w-5 h-5 text-acid flex-shrink-0" />
              <div>
                <span className="font-bold text-offwhite block">ZERO_STORAGE_GUARANTEE</span>
                <span>Messages live solely in volatile memory buffer and vanish without traces.</span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2 flex justify-end gap-3">
              <BrutalistButton variant="outline" size="md" onClick={onClose}>
                CANCEL
              </BrutalistButton>
              <BrutalistButton
                variant="primary"
                size="md"
                onClick={handleCreate}
                disabled={isSubmitting}
                techLabel="EXECUTE"
              >
                <span>{isSubmitting ? 'GENERATING...' : 'INITIALIZE ROOM'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </BrutalistButton>
            </div>
          </div>
        ) : (
          /* Step 2: Room Created & Link Sharing */
          <div className="space-y-5 font-mono text-xs">
            <div className="p-4 bg-ink border-2 border-acid space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-offwhite/50 text-[10px] uppercase">ROOM CREATED</span>
                <StatusIndicator status="live" label="WAITING FOR PEER" />
              </div>
              <div className="text-3xl font-display font-black text-acid tracking-widest">
                {createdRoomId}
              </div>
              <div className="text-[10px] text-offwhite/60">
                SHARE THIS INVITATION LINK WITH SOMEONE TO CONNECT.
              </div>
            </div>

            {/* Invitation URL Box */}
            <div className="p-2.5 bg-ink-950 border border-offwhite/40 break-all text-offwhite/90 select-all font-mono text-[11px]">
              {inviteUrl}
            </div>

            {/* Action Buttons: Copy, Share, QR */}
            <div className="grid grid-cols-3 gap-2">
              <BrutalistButton variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                <span>{copied ? 'COPIED ✓' : 'COPY'}</span>
              </BrutalistButton>

              <BrutalistButton variant="cyber" size="sm" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5 mr-1" />
                <span>SHARE</span>
              </BrutalistButton>

              <BrutalistButton variant="outline" size="sm" onClick={() => setShowQr(true)}>
                <QrCode className="w-3.5 h-3.5 mr-1" />
                <span>QR CODE</span>
              </BrutalistButton>
            </div>

            {/* Enter Room CTA */}
            <div className="pt-2">
              <BrutalistButton
                variant="primary"
                size="lg"
                onClick={() => onEnterRoom(createdRoomId)}
                className="w-full text-center"
              >
                <span>ENTER TERMINAL ROOM NOW</span>
                <ArrowRight className="w-5 h-5 ml-1.5" />
              </BrutalistButton>
            </div>
          </div>
        )}
      </div>

      {showQr && createdRoomId && (
        <QrCodeModal roomId={createdRoomId} onClose={() => setShowQr(false)} />
      )}
    </div>
  );
};
