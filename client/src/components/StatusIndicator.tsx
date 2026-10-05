import React from 'react';

interface StatusIndicatorProps {
  status?: 'live' | 'waiting' | 'error' | 'recording' | 'syncing';
  label?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status = 'live',
  label,
  pulse = true
}) => {
  const getColor = () => {
    switch (status) {
      case 'live':
        return 'bg-acid shadow-[0_0_8px_#B6FF00]';
      case 'waiting':
        return 'bg-warning shadow-[0_0_8px_#FFE600]';
      case 'error':
        return 'bg-danger shadow-[0_0_8px_#FF3030]';
      case 'recording':
        return 'bg-magenta shadow-[0_0_8px_#FF00A8]';
      case 'syncing':
        return 'bg-cyber shadow-[0_0_8px_#00E5FF]';
      default:
        return 'bg-acid';
    }
  };

  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider select-none">
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${getColor()}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${getColor()}`} />
      </span>
      {label && <span className="font-semibold text-offwhite/90">{label}</span>}
    </div>
  );
};
