import React from 'react';
import { TileColor } from '../types/game';
import { Tile } from './Tile';
import { CheckCircle2, Lock } from 'lucide-react';

interface WordleBoardProps {
  boardIndex: number;
  title: string;
  maxGuesses: number;
  guesses: string[];
  evaluations: TileColor[][];
  currentInput: string;
  isSolved: boolean;
  isGameOver: boolean;
  isShaking: boolean;
  revealingRow: number | null;
  winningRow: number | null;
  tileSize?: 'sm' | 'md' | 'lg';
  targetWord?: string;
  showSolutionOnLoss?: boolean;
  showBoardTitle?: boolean;
}

export const WordleBoard: React.FC<WordleBoardProps> = ({
  boardIndex,
  title,
  maxGuesses,
  guesses,
  evaluations,
  currentInput,
  isSolved,
  isGameOver,
  isShaking,
  revealingRow,
  winningRow,
  tileSize = 'md',
  targetWord = '',
  showSolutionOnLoss = false,
  showBoardTitle = false,
}) => {
  const totalRows = Math.min(maxGuesses, 13);
  const rows = [];

  for (let r = 0; r < totalRows; r++) {
    const isSubmitted = r < guesses.length;
    const isCurrent = r === guesses.length && !isSolved && !isGameOver;
    const isRevealing = r === revealingRow;
    const isWinning = r === winningRow;

    let rowLetters: string[] = ['', '', '', '', ''];
    let rowColors: TileColor[] = ['empty', 'empty', 'empty', 'empty', 'empty'];

    if (isSubmitted) {
      rowLetters = guesses[r].split('');
      rowColors = evaluations[r] || ['gray', 'gray', 'gray', 'gray', 'gray'];
    } else if (isCurrent) {
      rowLetters = currentInput.padEnd(5, ' ').slice(0, 5).split('').map((c) => c.trim());
      rowColors = rowLetters.map((l) => (l ? 'tbd' : 'empty'));
    }

    const rowShakeClass = isCurrent && isShaking ? 'animate-shake' : '';

    rows.push(
      <div key={`row-${r}`} className={`flex gap-[5px] justify-center ${rowShakeClass}`}>
        {rowLetters.map((letter, colIdx) => (
          <Tile
            key={`tile-${r}-${colIdx}`}
            letter={letter}
            color={rowColors[colIdx]}
            delayIndex={colIdx}
            isRevealing={isRevealing}
            isWinning={isWinning}
            size={tileSize}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      id={`board-${boardIndex}`}
      className={`relative flex flex-col items-center transition-all duration-300 ${
        showBoardTitle ? 'p-2 sm:p-3 rounded-lg bg-wordle-card/40 border border-wordle-border/60' : 'p-1'
      }`}
    >
      {/* Optional Board Header Badge for Multi-Board modes */}
      {showBoardTitle && (
        <div className="flex items-center justify-between w-full mb-2 px-1 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-wordle-subtext">
            {title}
            {isSolved && (
              <span className="inline-flex items-center text-emerald-400 gap-0.5 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Solved
              </span>
            )}
            {isGameOver && !isSolved && (
              <span className="inline-flex items-center text-red-400 gap-0.5 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" /> Failed
              </span>
            )}
          </span>
          {isGameOver && !isSolved && showSolutionOnLoss && targetWord && (
            <span className="text-red-300 font-mono font-bold tracking-wider uppercase text-[11px] bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/60">
              {targetWord}
            </span>
          )}
        </div>
      )}

      {/* Grid of 5-letter tiles */}
      <div className="flex flex-col gap-[5px] justify-center items-center">
        {rows}
      </div>
    </div>
  );
};
