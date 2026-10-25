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
      {/* Octordle Quick-Jump Status Bar */}
      {mode === 'octordle' && (
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-2 mb-4 bg-wordle-card border border-wordle-border rounded-xl flex items-center justify-center gap-2 sm:gap-3 select-none shadow-sm">
          <span className="text-xs font-extrabold uppercase tracking-wider text-wordle-subtext whitespace-nowrap">
            Status:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
            {boards.map((b, idx) => (
              <button
                key={`octo-ribbon-${idx}`}
                onClick={() => scrollToBoard(idx)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  b.isSolved
                    ? 'bg-wordle-green/20 text-emerald-400 border border-wordle-green/50 hover:bg-wordle-green/30'
                    : 'bg-wordle-elevated text-gray-300 border border-wordle-border hover:border-wordle-borderLight hover:text-white'
                }`}
                title={`Jump to Board #${idx + 1}${b.isSolved ? ' (Solved)' : ''}`}
                aria-label={`Jump to Board ${idx + 1}`}
              >
                <span>#{idx + 1}</span>
                {b.isSolved ? (
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            ))}
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
