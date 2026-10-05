import React, { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

// Curated high-performance GIFs across the required categories
const GIF_DATABASE: Record<string, string[]> = {
  REACTION: [
    'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', // nodding
    'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', // mind blown
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // popcorn
    'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', // cat typing
  ],
  FUNNY: [
    'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif', // spongebob
    'https://media.giphy.com/media/9u1J84ZtCSlGnLaeKP/giphy.gif', // cat dance
    'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', // Kermit typing
    'https://media.giphy.com/media/ule4vhcY1xEKQ/giphy.gif', // hacker cat
  ],
  LOVE: [
    'https://media.giphy.com/media/26FLdmG4ALHNRxijuc/giphy.gif', // heart pixel
    'https://media.giphy.com/media/l41lT4n6ylgW2qqr6/giphy.gif', // retro love
    'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif', // heart thumbs
  ],
  MEME: [
    'https://media.giphy.com/media/QMHoU66sBXCAU/giphy.gif', // this is fine
    'https://media.giphy.com/media/VbnUQIRNNzrD94Ripg/giphy.gif', // stonks
    'https://media.giphy.com/media/gTURHJs4e2Ies/giphy.gif', // hacker matrix
    'https://media.giphy.com/media/d2bOZ4zvrSaNsoco/giphy.gif', // neon cyber
  ],
  ANIME: [
    'https://media.giphy.com/media/bOzHoPN3I6qRXdECpD/giphy.gif', // akira bike
    'https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif', // evangelion eva
    'https://media.giphy.com/media/13FrpexOSXMjS0/giphy.gif', // cowboy bebop
    'https://media.giphy.com/media/a6O5fkWhdLT0c/giphy.gif', // ghost in shell
  ],
  CELEBRATION: [
    'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', // confetti party
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // celebration
    'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif', // retro disco
  ],
  SAD: [
    'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif', // sad cat
    'https://media.giphy.com/media/7SF5scGB2AFrgsXP63/giphy.gif', // pikachu sad
    'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif', // crying rain
  ],
  RANDOM: [
    'https://media.giphy.com/media/o0vwzuFwCGAFO/giphy.gif', // y2k wireframe
    'https://media.giphy.com/media/3oKIPheM4s21GL0bQc/giphy.gif', // cyberspace
    'https://media.giphy.com/media/hz6L3FwCc3hI2zUAFI/giphy.gif', // glitch art
    'https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif', // terminal code
  ]
};

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('REACTION');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Object.keys(GIF_DATABASE);

  const displayedGifs = searchQuery.trim()
    ? Object.entries(GIF_DATABASE).flatMap(([cat, urls]) =>
        cat.toLowerCase().includes(searchQuery.toLowerCase()) ? urls : []
      )
    : GIF_DATABASE[selectedCategory] || [];

  return (
    <div className="absolute bottom-16 left-0 right-0 sm:left-auto sm:right-0 sm:w-96 bg-ink-900 border-2 border-offwhite shadow-brutal-white p-3 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink-600">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-acid uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CYBER_GIF // DIRECTORY</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-offwhite/60 hover:text-danger hover:border border-transparent hover:border-danger transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH_GIF >"
          className="w-full bg-ink border border-offwhite/40 px-2.5 py-1.5 pl-8 text-xs font-mono text-offwhite placeholder-offwhite/40 focus:outline-none focus:border-acid"
        />
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-offwhite/40" />
      </div>

      {/* Category Pills */}
      {!searchQuery && (
        <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-[10px] font-mono whitespace-nowrap uppercase border transition-colors ${
                selectedCategory === cat
                  ? 'bg-acid text-ink font-bold border-acid'
                  : 'bg-ink-800 text-offwhite/70 border-ink-600 hover:border-offwhite'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid of GIFs */}
      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-ink border border-ink-600">
        {displayedGifs.length > 0 ? (
          displayedGifs.map((url, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectGif(url);
                onClose();
              }}
              className="relative aspect-video border border-offwhite/20 hover:border-acid cursor-pointer overflow-hidden group transition-all"
            >
              <img
                src={url}
                alt="GIF"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-acid/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-mono text-[10px] text-ink font-bold bg-white/40">
                [SEND]
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-6 font-mono text-xs text-offwhite/50">
            NO_GIFS_FOUND // TRY ANOTHER CATEGORY
          </div>
        )}
      </div>
    </div>
  );
};
