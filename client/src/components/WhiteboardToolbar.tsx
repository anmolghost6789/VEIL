import React from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Minus,
  Square,
  Circle,
  MoveRight,
  Type,
  RotateCcw,
  RotateCw,
  Trash2
} from 'lucide-react';
import { WhiteboardTool } from '../types';

interface WhiteboardToolbarProps {
  currentTool: WhiteboardTool;
  currentColor: string;
  currentSize: number;
  onSelectTool: (tool: WhiteboardTool) => void;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { id: WhiteboardTool; label: string; icon: React.ReactNode }[] = [
  { id: 'pen', label: 'PEN', icon: <Pen className="w-3.5 h-3.5" /> },
  { id: 'marker', label: 'MARKER', icon: <Highlighter className="w-3.5 h-3.5" /> },
  { id: 'eraser', label: 'ERASER', icon: <Eraser className="w-3.5 h-3.5" /> },
  { id: 'line', label: 'LINE', icon: <Minus className="w-3.5 h-3.5" /> },
  { id: 'rect', label: 'RECT', icon: <Square className="w-3.5 h-3.5" /> },
  { id: 'circle', label: 'CIRCLE', icon: <Circle className="w-3.5 h-3.5" /> },
  { id: 'arrow', label: 'ARROW', icon: <MoveRight className="w-3.5 h-3.5" /> },
  { id: 'text', label: 'TEXT', icon: <Type className="w-3.5 h-3.5" /> },
];

const COLORS = [
  { hex: '#B6FF00', name: 'ACID' },
  { hex: '#00E5FF', name: 'CYAN' },
  { hex: '#FF00A8', name: 'MAGENTA' },
  { hex: '#FFE600', name: 'YELLOW' },
  { hex: '#FF3030', name: 'RED' },
  { hex: '#F1EFE6', name: 'WHITE' },
  { hex: '#090909', name: 'BLACK' }
];

const SIZES = [2, 5, 12, 24];

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  currentTool,
  currentColor,
  currentSize,
  onSelectTool,
  onSelectColor,
  onSelectSize,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-ink border-b-2 border-offwhite/20 select-none font-mono text-xs">
      {/* Tool Selection */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={t.label}
            className={`flex items-center gap-1 px-2 py-1 border transition-colors ${
              currentTool === t.id
                ? 'bg-acid text-ink font-bold border-acid shadow-brutal-white'
                : 'bg-ink-800 text-offwhite/80 border-ink-600 hover:border-offwhite'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Colors & Size */}
      <div className="flex items-center gap-3">
        {/* Color Palette */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => onSelectColor(c.hex)}
              title={c.name}
              className={`w-5 h-5 border transition-transform ${
                currentColor === c.hex ? 'scale-125 border-offwhite ring-1 ring-acid' : 'border-ink-600'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-1 border border-ink-600 bg-ink-800 px-1 py-0.5">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onSelectSize(size)}
              className={`px-1.5 py-0.5 text-[10px] ${
                currentSize === size ? 'bg-acid text-ink font-bold' : 'text-offwhite/50 hover:text-offwhite'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>

        {/* Undo / Redo / Clear */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="p-1 border border-ink-600 bg-ink-800 disabled:opacity-30 hover:border-offwhite text-offwhite"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-1 border border-ink-600 bg-ink-800 disabled:opacity-30 hover:border-offwhite text-offwhite"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClear}
            title="Clear Canvas"
            className="p-1 border border-danger/60 bg-danger/10 text-danger hover:bg-danger hover:text-ink transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
