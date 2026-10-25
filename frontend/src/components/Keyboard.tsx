import React, { useEffect } from 'react';
import { BoardState, GameMode, TileColor } from '../types/game';
import { KeyCap } from './KeyCap';
import { sound } from '../services/audio';

interface KeyboardProps {
  mode: GameMode;
  boards: BoardState[];
  onKey: (char: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

const COLOR_PRIORITY: Record<TileColor, number> = {
  green: 4,
  yellow: 3,
  gray: 2,
  tbd: 1,
  empty: 0,
};

export const Keyboard: React.FC<KeyboardProps> = ({
  mode,
  boards,
  onKey,
  onEnter,
  onBackspace,
  disabled = false,
}) => {
  // Listen for physical keyboard input with authentic sound feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        e.preventDefault();
        sound.playKeyTap();
        onEnter();
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        sound.playBackspaceTap();
        onBackspace();
      } else if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        sound.playKeyTap();
        onKey(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onKey, onEnter, onBackspace]);

  // Compute status per letter for each board
  const getKeyStatuses = (letter: string): TileColor[] => {
    const l = letter.toLowerCase();
    const result: TileColor[] = [];

    boards.forEach((board) => {
      let bestStatus: TileColor = 'empty';

      for (let r = 0; r < board.guesses.length; r++) {
        const guess = board.guesses[r].toLowerCase();
        const evals = board.evaluations[r];
        for (let i = 0; i < 5; i++) {
          if (guess[i] === l) {
            const status = evals[i] || 'gray';
            if (COLOR_PRIORITY[status] > COLOR_PRIORITY[bestStatus]) {
              bestStatus = status;
            }
          }
        }
      }

      result.push(bestStatus);
    });

    return result;
  };

  const handleKeyClick = (val: string) => {
    if (disabled) return;
    if (val === 'ENTER') {
      onEnter();
    } else if (val === 'BACKSPACE') {
      onBackspace();
    } else {
      onKey(val);
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto px-1.5 py-1 select-none">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {ROWS.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex justify-center gap-1 sm:gap-1.5 w-full touch-manipulation">
            {/* Row 2 half-key spacer for centered alignment like official Wordle */}
            {rowIdx === 1 && <div className="flex-[0.5]" />}

            {row.map((letter) => {
              const isWide = letter === 'ENTER' || letter === 'BACKSPACE';
              const statuses = getKeyStatuses(letter);

              return (
                <KeyCap
                  key={letter}
                  letter={letter}
                  mode={mode}
                  statuses={statuses}
                  onClick={handleKeyClick}
                  isWide={isWide}
                />
              );
            })}

            {rowIdx === 1 && <div className="flex-[0.5]" />}
          </div>
        ))}
      </div>
    </div>
  );
};
