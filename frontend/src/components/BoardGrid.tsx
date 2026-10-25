import React from 'react';
import { BoardState, GameMode } from '../types/game';
import { WordleBoard } from './WordleBoard';
import { Check, Dot } from 'lucide-react';

interface BoardGridProps {
  mode: GameMode;
  boards: BoardState[];
  currentInput: string;
  isGameOver: boolean;
  isShaking: boolean;
  maxGuesses: number;
  revealingRow: number | null;
  winningRows: Record<number, number>; // boardIndex -> winning row index
  absurdleCandidateCount?: number;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  mode,
  boards,
  currentInput,
  isGameOver,
  isShaking,
  maxGuesses,
  revealingRow,
  winningRows,
  absurdleCandidateCount,
}) => {
  const scrollToBoard = (index: number) => {
    const el = document.getElementById(`board-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Grid styling based on mode
  const gridContainerClass = {
    classic: 'flex justify-center items-center',
    dordle: 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto',
    quordle: 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto',
    octordle: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-7xl mx-auto',
    absurdle: 'flex justify-center items-center',
  }[mode];

  // Tile size per modality
  const tileSize = {
    classic: 'lg' as const,
    dordle: 'md' as const,
    quordle: 'md' as const,
    octordle: 'sm' as const,
    absurdle: 'lg' as const,
  }[mode];

  const showBoardTitle = mode !== 'classic' && mode !== 'absurdle';

  return (
    <div className="w-full flex flex-col items-center justify-center flex-1 my-auto">
      {/* Octordle Quick-Jump Status Ribbon */}
      {mode === 'octordle' && (
        <div className="sticky top-2 z-20 w-full flex justify-center mb-3 pointer-events-none">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-full bg-wordle-card/95 border border-wordle-border backdrop-blur-md shadow-xl pointer-events-auto select-none">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-wordle-subtext pr-1 hidden sm:inline">
              Boards:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {boards.map((b, idx) => (
                <button
                  key={`octo-ribbon-${idx}`}
                  onClick={() => scrollToBoard(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    b.isSolved
                      ? 'bg-wordle-green text-white shadow-sm ring-1 ring-wordle-green/50 hover:scale-110'
                      : 'bg-wordle-elevated border border-wordle-border text-gray-300 hover:text-white hover:border-wordle-borderLight hover:scale-105'
                  }`}
                  title={`Jump to Board #${idx + 1}${b.isSolved ? ' (Solved)' : ''}`}
                  aria-label={`Jump to Board ${idx + 1}`}
                >
                  {b.isSolved ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Absurdle Candidate Pool HUD */}
      {mode === 'absurdle' && absurdleCandidateCount !== undefined && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-wordle-card border border-wordle-border text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-wordle-subtext">Word Pool:</span>
          <span className="font-mono text-amber-400 font-bold">
            {absurdleCandidateCount.toLocaleString()} remaining
          </span>
        </div>
      )}

      {/* Grid of Wordle Boards */}
      <div className={`w-full ${gridContainerClass}`}>
        {boards.map((board, idx) => (
          <WordleBoard
            key={`board-${board.targetIndex}`}
            boardIndex={board.targetIndex}
            title={
              mode === 'classic'
                ? 'Wordle'
                : mode === 'absurdle'
                ? 'Absurdle'
                : `Board #${idx + 1}`
            }
            maxGuesses={maxGuesses}
            guesses={board.guesses}
            evaluations={board.evaluations}
            currentInput={currentInput}
            isSolved={board.isSolved}
            isGameOver={isGameOver}
            isShaking={isShaking}
            revealingRow={revealingRow}
            winningRow={winningRows[board.targetIndex] ?? null}
            tileSize={tileSize}
            targetWord={board.targetWord}
            showSolutionOnLoss={true}
            showBoardTitle={showBoardTitle}
          />
        ))}
      </div>
    </div>
  );
};
