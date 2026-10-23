import React, { useEffect, useState } from 'react';
import { TileColor } from '../types/game';
import { sound } from '../services/audio';

interface TileProps {
  letter?: string;
  color?: TileColor;
  delayIndex?: number;
  isRevealing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Tile: React.FC<TileProps> = ({
  letter = '',
  color = 'empty',
  delayIndex = 0,
  isRevealing = false,
  size = 'md',
}) => {
  const [displayColor, setDisplayColor] = useState<TileColor>(color);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  useEffect(() => {
    if (isRevealing) {
      const delay = delayIndex * 250;
      const flipTimer = setTimeout(() => {
        setIsFlipping(true);
        sound.playTileFlip(delayIndex);

        // Midpoint of 500ms flip animation (250ms in)
        const colorTimer = setTimeout(() => {
          setDisplayColor(color);
        }, 150);

        const endTimer = setTimeout(() => {
          setIsFlipping(false);
        }, 500);

        return () => {
          clearTimeout(colorTimer);
          clearTimeout(endTimer);
        };
      }, delay);

      return () => clearTimeout(flipTimer);
    } else {
      setDisplayColor(color);
      setIsFlipping(false);
    }
  }, [color, isRevealing, delayIndex]);

  // Size styling classes
  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base font-bold',
    md: 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl font-extrabold',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl font-black',
  }[size];

  // Tile background and border styling based on state
  let bgBorderClass = 'bg-transparent border-2 border-wordle-border text-white';

  if (!isRevealing || displayColor !== 'empty') {
    switch (displayColor) {
      case 'green':
        bgBorderClass = 'bg-wordle-green border-wordle-green text-white shadow-sm';
        break;
      case 'yellow':
        bgBorderClass = 'bg-wordle-yellow border-wordle-yellow text-white shadow-sm';
        break;
      case 'gray':
        bgBorderClass = 'bg-wordle-gray border-wordle-gray text-white/90';
        break;
      case 'tbd':
        bgBorderClass = 'bg-transparent border-2 border-wordle-borderLight text-white animate-pop';
        break;
      default:
        bgBorderClass = letter
          ? 'bg-transparent border-2 border-wordle-borderLight text-white animate-pop'
          : 'bg-transparent border-2 border-wordle-border text-white';
        break;
    }
  }

  return (
    <div className={`perspective-1000 ${sizeClasses} select-none`}>
      <div
        className={`w-full h-full flex items-center justify-center rounded uppercase transition-all duration-300 ${bgBorderClass} ${
          isFlipping ? 'animate-flip-in' : ''
        }`}
      >
        {letter}
      </div>
    </div>
  );
};
