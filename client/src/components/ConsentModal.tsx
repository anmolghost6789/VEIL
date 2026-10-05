import React from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';

interface ConsentModalProps {
  requesterName: string;
  messageContent: string;
  messageType?: string;
  onAllow: () => void;
  onDeny: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  requesterName,
  messageContent,
  messageType = 'TEXT',
  onAllow,
  onDeny
}) => {
  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-ink-900 border-2 border-warning shadow-brutal-white p-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-warning/40 text-warning font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-5 h-5 text-warning animate-pulse" />
          <span>MESSAGE SAVE REQUEST // {messageType}</span>
        </div>

        {/* Notice text */}
        <div className="font-mono text-xs text-offwhite space-y-2 mb-4">
          <p className="font-bold text-acid uppercase">
            {requesterName} REQUESTS PERMISSION TO SAVE THIS MESSAGE.
          </p>
          <p className="text-[11px] text-offwhite/60">
            Messages are ephemeral and expunged automatically unless both participants grant explicit dual-consent.
          </p>
        </div>

        {/* Message preview block */}
        <div className="p-3 bg-ink border-2 border-offwhite/30 mb-5 font-mono text-xs text-offwhite/90 italic break-words max-h-36 overflow-y-auto">
          &quot;{messageContent}&quot;
        </div>

        {/* Consent Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-600">
          <BrutalistButton variant="danger" size="md" onClick={onDeny}>
            <X className="w-4 h-4 mr-1" />
            <span>DENY</span>
          </BrutalistButton>

          <BrutalistButton variant="primary" size="md" onClick={onAllow}>
            <Check className="w-4 h-4 mr-1" />
            <span>ALLOW PERMANENT SAVE</span>
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};
