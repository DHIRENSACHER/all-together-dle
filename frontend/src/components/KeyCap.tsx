import React from 'react';
import { GameMode, TileColor } from '../types/game';
import { sound } from '../services/audio';

interface KeyCapProps {
  letter: string;
  mode: GameMode;
  statuses: TileColor[]; // Status per board (length 1, 2, 4, or 8)
  onClick: (val: string) => void;
  isWide?: boolean;
}

const COLOR_CLASSES: Record<TileColor, string> = {
  green: 'bg-wordle-green',
  yellow: 'bg-wordle-yellow',
  gray: 'bg-wordle-gray',
  tbd: 'bg-wordle-keyDefault',
  empty: 'bg-wordle-keyDefault',
};

export const KeyCap: React.FC<KeyCapProps> = ({
  letter,
  mode,
  statuses,
  onClick,
  isWide = false,
}) => {
  const handleClick = () => {
    sound.playKeyTap();
    onClick(letter);
  };

  const isActionKey = letter === 'ENTER' || letter === 'BACKSPACE';

  // Render segments based on mode
  const renderBackground = () => {
    if (isActionKey || mode === 'classic' || mode === 'absurdle' || statuses.length <= 1) {
      const status = statuses[0] || 'empty';
      return (
        <div
          className={`absolute inset-0 w-full h-full rounded transition-colors duration-300 ${COLOR_CLASSES[status]}`}
        />
      );
    }

    if (mode === 'dordle') {
      // 2 vertical slices
      const s0 = statuses[0] || 'empty';
      const s1 = statuses[1] || 'empty';
      return (
        <div className="absolute inset-0 w-full h-full rounded overflow-hidden grid grid-cols-2">
          <div className={`h-full ${COLOR_CLASSES[s0]} border-r border-black/20`} />
          <div className={`h-full ${COLOR_CLASSES[s1]}`} />
        </div>
      );
    }

    if (mode === 'quordle') {
      // 4 quadrant slices (2x2)
      return (
        <div className="absolute inset-0 w-full h-full rounded overflow-hidden grid grid-cols-2 grid-rows-2">
          <div className={`h-full border-r border-b border-black/20 ${COLOR_CLASSES[statuses[0] || 'empty']}`} />
          <div className={`h-full border-b border-black/20 ${COLOR_CLASSES[statuses[1] || 'empty']}`} />
          <div className={`h-full border-r border-black/20 ${COLOR_CLASSES[statuses[2] || 'empty']}`} />
          <div className={`h-full ${COLOR_CLASSES[statuses[3] || 'empty']}`} />
        </div>
      );
    }

    if (mode === 'octordle') {
      // 8 vertical stripes
      return (
        <div className="absolute inset-0 w-full h-full rounded overflow-hidden grid grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`octo-seg-${i}`}
              className={`h-full ${COLOR_CLASSES[statuses[i] || 'empty']} ${
                i < 7 ? 'border-r border-black/20' : ''
              }`}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={`absolute inset-0 w-full h-full rounded ${
          COLOR_CLASSES[statuses[0] || 'empty']
        }`}
      />
    );
  };

  const widthClass = isWide
    ? 'flex-[1.5] min-w-[50px] sm:min-w-[65px] text-xs font-bold'
    : 'flex-1 min-w-[28px] sm:min-w-[38px] text-sm sm:text-base font-extrabold';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative h-12 sm:h-14 rounded overflow-hidden select-none active:scale-95 transition-transform duration-75 flex items-center justify-center ${widthClass}`}
      aria-label={letter}
    >
      {renderBackground()}
      <span className="relative z-10 text-white uppercase pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
        {letter === 'BACKSPACE' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-8.172a2 2 0 01-1.414-.586L3 12z"
            />
          </svg>
        ) : (
          letter
        )}
      </span>
    </button>
  );
};
