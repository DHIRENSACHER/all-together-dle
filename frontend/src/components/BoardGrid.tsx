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
        <div className="sticky top-14 z-20 w-full max-w-4xl px-2 py-2 mb-4 bg-wordle-card/90 backdrop-blur-md rounded-xl border border-wordle-border shadow-md flex items-center justify-between gap-1 overflow-x-auto">
          <div className="text-xs font-semibold text-wordle-subtext whitespace-nowrap pl-1">
            Status:
          </div>
          <div className="flex gap-1.5 overflow-x-auto py-0.5">
            {boards.map((b, idx) => (
              <button
                key={`octo-ribbon-${idx}`}
                onClick={() => scrollToBoard(idx)}
                className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-bold transition-all ${
                  b.isSolved
                    ? 'bg-wordle-green/20 text-emerald-400 border border-wordle-green/50 hover:bg-wordle-green/30'
                    : 'bg-wordle-border/40 text-gray-300 border border-wordle-border hover:bg-wordle-border/80'
                }`}
                title={`Jump to Board #${idx + 1}`}
              >
                <span>#{idx + 1}</span>
                {b.isSolved ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Dot className="w-3 h-3 text-amber-400" />
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
