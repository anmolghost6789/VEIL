import React from 'react';
import { X } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_GROUPS = [
  { name: 'POPULAR', items: ['👋', '💀', '🔥', '⚡', '👁️', '🔒', '💣', '🚀'] },
  { name: 'TERMINAL', items: ['💻', '💾', '📼', '🛰️', '📡', '🕹️', '⏱️', '🔋'] },
  { name: 'REACTIONS', items: ['😎', '🤖', '👾', '👀', '🤫', '🤯', '😱', '🤡'] },
  { name: 'SYMBOLS', items: ['⚠️', '☢️', '☣️', '🛑', '✓', '✗', '✦', '▲'] }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  return (
    <div className="absolute bottom-16 left-0 sm:left-12 bg-ink-900 border-2 border-offwhite shadow-brutal-white p-3 z-50 w-72 animate-in fade-in-0 duration-150">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-ink-600">
        <span className="font-mono text-xs font-bold text-cyber uppercase tracking-wider">
          GLYPH_PICKER
        </span>
        <button
          onClick={onClose}
          className="text-offwhite/60 hover:text-danger p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {EMOJI_GROUPS.map((group) => (
          <div key={group.name}>
            <div className="text-[10px] font-mono text-offwhite/40 mb-1">{group.name}</div>
            <div className="grid grid-cols-8 gap-1">
              {group.items.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectEmoji(emoji);
                    onClose();
                  }}
                  className="p-1 text-base hover:bg-ink-700 hover:scale-125 transition-transform text-center rounded-none border border-transparent hover:border-offwhite/40"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
