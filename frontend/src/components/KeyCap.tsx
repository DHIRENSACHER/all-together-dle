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
  green: 'bg-wordle-green text-white',
  yellow: 'bg-wordle-yellow text-white',
  gray: 'bg-wordle-gray text-white',
  tbd: 'bg-wordle-keyDefault text-white',
  empty: 'bg-wordle-keyDefault text-white',
};

export const KeyCap: React.FC<KeyCapProps> = ({
  letter,
  mode,
  statuses,
  onClick,
  isWide = false,
}) => {
  const handleClick = () => {
    if (letter === 'BACKSPACE') {
      sound.playBackspaceTap();
    } else {
      sound.playKeyTap();
    }
    onClick(letter);
  };

  const isActionKey = letter === 'ENTER' || letter === 'BACKSPACE';

  // Render segments based on mode
  const renderBackground = () => {
    if (isActionKey || mode === 'classic' || mode === 'absurdle' || statuses.length <= 1) {
      const status = statuses[0] || 'empty';
      return (
        <div
          className={`absolute inset-0 w-full h-full rounded-[4px] transition-colors duration-300 ${COLOR_CLASSES[status]}`}
        />
      );
    }

    if (mode === 'dordle') {
      // 2 vertical slices
      const s0 = statuses[0] || 'empty';
      const s1 = statuses[1] || 'empty';
      return (
        <div className="absolute inset-0 w-full h-full rounded-[4px] overflow-hidden grid grid-cols-2">
          <div className={`h-full ${COLOR_CLASSES[s0]} border-r border-black/20`} />
          <div className={`h-full ${COLOR_CLASSES[s1]}`} />
        </div>
      );
    }

    if (mode === 'quordle') {
      // 4 quadrant slices (2x2)
      return (
        <div className="absolute inset-0 w-full h-full rounded-[4px] overflow-hidden grid grid-cols-2 grid-rows-2">
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
        <div className="absolute inset-0 w-full h-full rounded-[4px] overflow-hidden grid grid-cols-8">
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
        className={`absolute inset-0 w-full h-full rounded-[4px] ${
          COLOR_CLASSES[statuses[0] || 'empty']
        }`}
      />
    );
  };

  const widthClass = isWide
    ? 'flex-[1.5] min-w-[54px] sm:min-w-[65px] text-[11px] sm:text-xs font-bold'
    : 'flex-1 min-w-[30px] sm:min-w-[42px] text-sm sm:text-base font-bold';

  return (
    <button
      onClick={handleClick}
      aria-label={letter === 'BACKSPACE' ? 'Backspace' : letter}
      className={`relative h-12 sm:h-[58px] ${widthClass} rounded-[4px] flex items-center justify-center cursor-pointer select-none overflow-hidden transition-transform active:scale-[0.96] active:brightness-90 duration-75`}
    >
      {renderBackground()}
      <span className="relative z-10 font-bold uppercase tracking-wide text-white flex items-center justify-center">
        {letter === 'BACKSPACE' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="22"
            viewBox="0 0 24 24"
            width="22"
            className="w-5 h-5 sm:w-6 sm:h-6 fill-current"
          >
            <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z" />
          </svg>
        ) : (
          letter
        )}
      </span>
    </button>
  );
};
