import React from 'react';
import { X, Settings, Flame, Shield, Clock } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';
import { RoomSettings } from '../types';

interface RoomSettingsModalProps {
  currentTtl: number;
  settings: RoomSettings;
  isHost: boolean;
  onUpdateTtl: (newTtl: number) => void;
  onUpdateSettings: (newSettings: Partial<RoomSettings>) => void;
  onDestroyRoom: () => void;
  onClose: () => void;
}

const TTL_OPTIONS = [
  { label: '10 SEC', value: 10 },
  { label: '30 SEC', value: 30 },
  { label: '1 MIN', value: 60 },
  { label: '5 MIN', value: 300 },
  { label: '1 HOUR', value: 3600 }
];

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  currentTtl,
  settings,
  isHost,
  onUpdateTtl,
  onUpdateSettings,
  onDestroyRoom,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-ink-900 border-2 border-offwhite shadow-brutal-white p-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-ink-600">
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-offwhite uppercase tracking-wider">
            <Settings className="w-4 h-4 text-acid" />
            <span>ROOM_SETTINGS // CONFIGURATION</span>
          </div>
          <button onClick={onClose} className="text-offwhite/60 hover:text-danger p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 font-mono text-xs">
          {/* TTL Configuration */}
          <div>
            <div className="flex items-center gap-1.5 text-offwhite/70 mb-2 font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-warning" />
              <span>MESSAGE TTL (EXPIRATION DURATION)</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TTL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={!isHost}
                  onClick={() => onUpdateTtl(opt.value)}
                  className={`py-2 text-center border font-bold transition-all ${
                    currentTtl === opt.value
                      ? 'bg-warning text-ink border-warning shadow-brutal'
                      : 'bg-ink-800 text-offwhite/70 border-ink-600 hover:border-offwhite'
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {!isHost && (
              <div className="text-[10px] text-offwhite/40 mt-1.5 italic">
                * ONLY THE ROOM HOST CAN MODIFY RETENTION POLICY
              </div>
            )}
          </div>

          {/* Feature Access Toggles */}
          <div>
            <div className="flex items-center gap-1.5 text-offwhite/70 mb-3 font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-cyber" />
              <span>PERMISSION POLICIES</span>
            </div>
            <div className="space-y-2">
              {[
                { key: 'allowFiles', label: 'ALLOW FILE TRANSFERS', val: settings.allowFiles },
                { key: 'allowScreenShare', label: 'ALLOW SCREEN SHARING', val: settings.allowScreenShare },
                { key: 'allowWhiteboard', label: 'ALLOW COLLABORATIVE WHITEBOARD', val: settings.allowWhiteboard },
                { key: 'allowVoice', label: 'ALLOW VOICE LINK', val: settings.allowVoice },
                { key: 'allowVideo', label: 'ALLOW VIDEO LINK', val: settings.allowVideo }
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 bg-ink border border-ink-600"
                >
                  <span className="text-offwhite/80">{item.label}</span>
                  <button
                    disabled={!isHost}
                    onClick={() =>
                      onUpdateSettings({ [item.key]: !item.val })
                    }
                    className={`px-3 py-0.5 font-bold text-[10px] border transition-colors ${
                      item.val
                        ? 'bg-acid text-ink border-acid'
                        : 'bg-ink-800 text-danger border-danger/60'
                    }`}
                  >
                    {item.val ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Self-Destruct Action */}
          <div className="pt-4 border-t border-ink-600 flex items-center justify-between">
            <div className="text-[10px] text-danger/80">
              PURGE ALL BUFFERS, CANVASES &amp; TERMINATE ROOM
            </div>
            <BrutalistButton variant="danger" size="sm" onClick={onDestroyRoom}>
              <Flame className="w-3.5 h-3.5 mr-1" />
              <span>DESTROY ROOM NOW</span>
            </BrutalistButton>
          </div>
        </div>
      </div>
    </div>
  );
};
