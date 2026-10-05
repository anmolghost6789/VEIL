import React, { useState, useRef } from 'react';
import { EphemeralMessage } from '../types';
import { MessageTimer } from './MessageTimer';
import { Bookmark, Lock, FileText, Download, Play, Pause, AlertTriangle } from 'lucide-react';
import { playExpireDisintegrate } from '../services/audio';

interface MessageBubbleProps {
  message: EphemeralMessage;
  isSelf: boolean;
  onSaveRequest: (messageId: string) => void;
  onExpired: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  onSaveRequest,
  onExpired
}) => {
  const [isExpiringEffect, setIsExpiringEffect] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formattedTime = new Date(message.createdAt).toTimeString().split(' ')[0];

  const handleExpire = () => {
    if (message.isSaved) return;
    setIsExpiringEffect(true);
    playExpireDisintegrate();
    setTimeout(() => {
      onExpired(message.id);
    }, 600);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div
      className={`flex flex-col mb-4 select-text max-w-xl transition-all duration-300 ${
        isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
      } ${isExpiringEffect ? 'opacity-0 scale-95 transition-all duration-500' : 'animate-in fade-in-0 duration-200'}`}
    >
      {/* Header: Sender & Monospace Time */}
      <div className="flex items-center gap-2 mb-1 px-1 font-mono text-[11px] tracking-wider">
        <span className={`font-bold ${isSelf ? 'text-acid' : 'text-cyber'}`}>
          {isSelf ? `YOU [${message.senderName}]` : message.senderName}
        </span>
        <span className="text-offwhite/40">{formattedTime}</span>
      </div>

      {/* Main Bubble Container with Brutalist Borders */}
      <div
        className={`
          relative border-2 transition-colors duration-200 p-3 sm:p-4
          ${
            message.isSaved
              ? 'border-acid bg-ink-800 shadow-brutal-acid'
              : isSelf
              ? 'border-offwhite bg-ink-800 text-offwhite shadow-brutal-white'
              : 'border-offwhite/70 bg-ink-900 text-offwhite shadow-brutal'
          }
        `}
      >
        {/* Redacted Glitch Overlay when message is expiring */}
        {isExpiringEffect ? (
          <div className="font-mono text-sm tracking-widest text-warning bg-ink px-2 py-1 select-none animate-pulse">
            ██████████████ [EXPUNGED]
          </div>
        ) : (
          <>
            {/* TEXT MESSAGE */}
            {message.type === 'text' && (
              <p className="font-mono text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {/* GIF MESSAGE */}
            {message.type === 'gif' && (
              <div className="flex flex-col gap-1.5">
                <img
                  src={message.content}
                  alt="GIF"
                  className="max-w-[280px] sm:max-w-sm max-h-64 object-cover border border-offwhite/40"
                  loading="lazy"
                />
                <span className="text-[10px] font-mono text-offwhite/40">EPHEMERAL_GIF</span>
              </div>
            )}

            {/* FILE MESSAGE */}
            {message.type === 'file' && message.fileData && (
              <div className="flex items-center gap-3 border border-ink-600 bg-ink-950 p-2.5 min-w-[240px]">
                <div className="p-2 bg-cyber/10 border border-cyber/50 text-cyber">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 font-mono">
                  <div className="text-xs font-bold truncate text-offwhite">
                    {message.fileData.name}
                  </div>
                  <div className="text-[10px] text-offwhite/50">
                    SIZE: {(message.fileData.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <a
                  href={message.fileData.url}
                  download={message.fileData.name}
                  className="p-1.5 border border-offwhite/40 hover:border-acid hover:text-acid text-offwhite transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* AUDIO VOICE MESSAGE */}
            {message.type === 'audio' && (
              <div className="flex items-center gap-3 min-w-[220px]">
                <button
                  onClick={toggleAudio}
                  className="p-2 border border-acid bg-acid text-ink hover:bg-offwhite transition-colors"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <div className="flex-1 flex items-center gap-1 h-6">
                  {/* Spectrum wave animation */}
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-acid transition-all duration-150 ${
                        isPlayingAudio ? 'audio-bar' : 'h-2'
                      }`}
                      style={{
                        animationDelay: `${(i % 5) * 0.1}s`,
                        height: isPlayingAudio ? undefined : `${4 + (i % 4) * 3}px`
                      }}
                    />
                  ))}
                </div>
                <audio
                  ref={audioRef}
                  src={message.content}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />
                <span className="text-[10px] font-mono text-offwhite/50">VOICE_LOG</span>
              </div>
            )}
          </>
        )}

        {/* Saved Status Indicator or Save Request Consent State */}
        {message.isSaved ? (
          <div className="mt-2.5 pt-2 border-t border-acid/30 flex items-center justify-between text-[10px] font-mono text-acid">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>CONSENT VERIFIED // DUAL-APPROVED ✓</span>
            </div>
            <span className="font-bold">PERMANENT_RECORD</span>
          </div>
        ) : message.saveConsent?.status === 'pending' ? (
          <div className="mt-2.5 pt-2 border-t border-warning/40 flex items-center gap-1.5 text-[10px] font-mono text-warning">
            <AlertTriangle className="w-3 h-3 animate-spin" />
            <span>SAVE_REQUEST_PENDING_APPROVAL...</span>
          </div>
        ) : null}
      </div>

      {/* Footer Info: Expiration Countdown & Save Action */}
      <div className="flex items-center justify-between w-full mt-1 px-1">
        <MessageTimer
          createdAt={message.createdAt}
          expiresAt={message.expiresAt}
          isSaved={message.isSaved}
          onExpire={handleExpire}
        />

        {/* Dual Consent Save Button if not saved and not pending */}
        {!message.isSaved && message.saveConsent?.status !== 'pending' && (
          <button
            onClick={() => onSaveRequest(message.id)}
            title="Request dual-consent permission to save this message permanently"
            className="flex items-center gap-1 text-[10px] font-mono text-offwhite/40 hover:text-acid hover:underline transition-colors uppercase tracking-wider ml-3"
          >
            <Bookmark className="w-3 h-3" />
            <span>SAVE</span>
          </button>
        )}
      </div>
    </div>
  );
};
