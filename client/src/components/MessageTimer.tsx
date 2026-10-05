import React, { useEffect, useState } from 'react';

interface MessageTimerProps {
  createdAt: number;
  expiresAt: number;
  isSaved?: boolean;
  onExpire?: () => void;
}

export const MessageTimer: React.FC<MessageTimerProps> = ({
  createdAt,
  expiresAt,
  isSaved,
  onExpire
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (isSaved) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [expiresAt, isSaved, onExpire]);

  if (isSaved) {
    return (
      <div className="flex items-center gap-1 text-[10px] font-mono text-acid font-bold tracking-wider">
        <span>[SAVED]</span>
        <span>PERMANENT</span>
      </div>
    );
  }

  const totalDuration = Math.max(1, Math.floor((expiresAt - createdAt) / 1000));
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / totalDuration) * 100));

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = secondsLeft <= 10;
  const isCritical = secondsLeft <= 3;

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] select-none">
      {/* Progress mini track */}
      <div className="w-12 h-1.5 bg-ink-900 border border-ink-600 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isCritical ? 'bg-danger animate-pulse' : isWarning ? 'bg-warning' : 'bg-acid'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <span
        className={`tracking-widest font-bold ${
          isCritical
            ? 'text-danger animate-ping-fast'
            : isWarning
            ? 'text-warning font-black'
            : 'text-offwhite/60'
        }`}
      >
        TTL {formatted}
      </span>
    </div>
  );
};
