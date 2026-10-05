import React from 'react';
import { ShieldCheck, EyeOff, Lock, Radio } from 'lucide-react';

export const PrivacyStatus: React.FC = () => {
  return (
    <div className="border-2 border-offwhite/20 bg-ink-900 p-3 font-mono text-[10px] select-none">
      <div className="flex items-center gap-1.5 text-offwhite font-bold tracking-widest uppercase mb-2 border-b border-ink-600 pb-1">
        <ShieldCheck className="w-3.5 h-3.5 text-acid" />
        <span>PRIVACY STATUS MATRIX</span>
      </div>

      <div className="space-y-1 text-offwhite/70">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <EyeOff className="w-3 h-3 text-acid" /> MESSAGE HISTORY:
          </span>
          <span className="text-acid font-bold">NONE (ZERO_LOG)</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-cyber" /> TEMPORARY STORAGE:
          </span>
          <span className="text-cyber font-bold">ACTIVE (VOLATILE)</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-acid" /> ROOM ENCRYPTION:
          </span>
          <span className="text-acid font-bold">ACTIVE (TLS/P2P)</span>
        </div>

        <div className="flex justify-between items-center">
          <span>CALL RECORDING:</span>
          <span className="text-offwhite/40 font-bold">OFF (NOT PERMITTED)</span>
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-ink-700 text-[9px] text-offwhite/40 italic">
        * External hardware or manual screen capture cannot be prevented.
      </div>
    </div>
  );
};
