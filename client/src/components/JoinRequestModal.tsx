import React from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';

interface JoinRequestModalProps {
  requesterName: string;
  roomId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  requesterName,
  roomId,
  onAccept,
  onDecline
}) => {
  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-ink-900 border-2 border-cyber shadow-brutal-white p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-cyber/40 text-cyber font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          <span>INCOMING PEER CONNECTION // AUTHENTICATION</span>
        </div>

        <div className="font-mono text-xs text-offwhite space-y-3 mb-6">
          <div className="p-3 bg-ink border border-offwhite/30 text-center">
            <span className="text-acid font-bold text-base block mb-1 uppercase">
              {requesterName}
            </span>
            <span className="text-[11px] text-offwhite/70">
              REQUESTS ENTRY INTO TEMPORARY ROOM [{roomId}]
            </span>
          </div>

          <p className="text-[10px] text-offwhite/50 text-center">
            Only two participants are permitted per room. All messages, voice and canvas strokes will be synchronized peer-to-peer.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <BrutalistButton variant="danger" size="md" onClick={onDecline}>
            <X className="w-4 h-4 mr-1" />
            <span>DECLINE</span>
          </BrutalistButton>

          <BrutalistButton variant="primary" size="md" onClick={onAccept}>
            <Check className="w-4 h-4 mr-1" />
            <span>ACCEPT PEER</span>
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};
