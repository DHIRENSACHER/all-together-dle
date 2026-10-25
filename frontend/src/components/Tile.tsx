import React, { useEffect, useState } from 'react';
import { TileColor } from '../types/game';
import { sound } from '../services/audio';

interface TileProps {
  letter?: string;
  color?: TileColor;
  delayIndex?: number;
  isRevealing?: boolean;
  isWinning?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Tile: React.FC<TileProps> = ({
  letter = '',
  color = 'empty',
  delayIndex = 0,
  isRevealing = false,
  isWinning = false,
  size = 'md',
}) => {
  const [displayColor, setDisplayColor] = useState<TileColor>(color);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [hasRevealed, setHasRevealed] = useState<boolean>(!isRevealing && color !== 'empty');

  useEffect(() => {
    if (isRevealing) {
      const startDelay = delayIndex * 250;
      const flipTimer = setTimeout(() => {
        setIsFlipping(true);
        sound.playTileFlip(delayIndex);

        // Midpoint of 500ms flip animation (250ms in): swap color
        const colorTimer = setTimeout(() => {
          setDisplayColor(color);
          setHasRevealed(true);
        }, 250);

        const endTimer = setTimeout(() => {
          setIsFlipping(false);
        }, 500);

        return () => {
          clearTimeout(colorTimer);
          clearTimeout(endTimer);
        };
      }, startDelay);

      return () => clearTimeout(flipTimer);
    } else {
      setDisplayColor(color);
      setHasRevealed(color !== 'empty' && color !== 'tbd');
      setIsFlipping(false);
    }
  }, [color, isRevealing, delayIndex]);

  // Size styling classes
  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base font-bold',
    md: 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl font-extrabold',
    lg: 'w-12 h-12 sm:w-[62px] sm:h-[62px] text-2xl sm:text-3xl font-extrabold',
  }[size];

  // Tile background and border styling based on state
  let bgBorderClass = 'bg-transparent border-2 border-wordle-border text-white';

  if (hasRevealed || (!isRevealing && displayColor !== 'empty' && displayColor !== 'tbd')) {
    switch (displayColor) {
      case 'green':
        bgBorderClass = 'bg-wordle-green border-2 border-wordle-green text-white';
        break;
      case 'yellow':
        bgBorderClass = 'bg-wordle-yellow border-2 border-wordle-yellow text-white';
        break;
      case 'gray':
        bgBorderClass = 'bg-wordle-gray border-2 border-wordle-gray text-white';
        break;
      default:
        bgBorderClass = 'bg-transparent border-2 border-wordle-border text-white';
        break;
    }
  } else if (letter) {
    bgBorderClass = 'bg-transparent border-2 border-wordle-borderLight text-white animate-pop';
  }

  const bounceDelayStyle = isWinning
    ? { animationDelay: `${delayIndex * 100}ms` }
    : undefined;

  return (
    <div className={`perspective-1000 ${sizeClasses} select-none`}>
      <div
        style={bounceDelayStyle}
        className={`w-full h-full flex items-center justify-center rounded-[2px] uppercase transition-colors duration-150 ${bgBorderClass} ${
          isFlipping ? 'animate-flip' : ''
        } ${isWinning ? 'animate-win-bounce' : ''}`}
      >
        {letter}
      </div>
    </div>
  );
};
