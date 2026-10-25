import React from 'react';
import { GameMode, GameStats } from '../types/game';
import { X, Trophy, Share2, Flame } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  mode: GameMode;
  maxGuesses: number;
  lastSolvedTurn: number | null;
  onOpenShare: () => void;
  isGameCompleted: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  mode,
  maxGuesses,
  lastSolvedTurn,
  onOpenShare,
  isGameCompleted,
}) => {
  if (!isOpen) return null;

  const winPercentage =
    stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  // Maximum count among all guess counts for relative bar sizing
  const maxFreq = Math.max(
    1,
    ...Object.values(stats.guessDistribution || {})
  );

  const displayModeName = mode.charAt(0).toUpperCase() + mode.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-sm bg-wordle-card border border-wordle-border rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-wordle-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              {displayModeName} Statistics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-4 gap-2 my-5 text-center">
          <div className="p-2 rounded bg-wordle-elevated border border-wordle-border">
            <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.played}</div>
            <div className="text-[10px] uppercase font-bold text-wordle-subtext">Played</div>
          </div>
          <div className="p-2 rounded bg-wordle-elevated border border-wordle-border">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{winPercentage}%</div>
            <div className="text-[10px] uppercase font-bold text-wordle-subtext">Win %</div>
          </div>
          <div className="p-2 rounded bg-wordle-elevated border border-wordle-border">
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              {stats.currentStreak}
            </div>
            <div className="text-[10px] uppercase font-bold text-wordle-subtext">Current</div>
          </div>
          <div className="p-2 rounded bg-wordle-elevated border border-wordle-border">
            <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">{stats.maxStreak}</div>
            <div className="text-[10px] uppercase font-bold text-wordle-subtext">Max</div>
          </div>
        </div>

        {/* Guess Distribution Histogram */}
        {mode !== 'absurdle' && (
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-wordle-subtext mb-2.5">
              Guess Distribution
            </h3>
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              {Array.from({ length: Math.min(maxGuesses, 13) }).map((_, i) => {
                const turn = i + 1;
                const count = stats.guessDistribution[turn] || 0;
                const pct = Math.max(8, Math.round((count / maxFreq) * 100));
                const isCurrentWin = lastSolvedTurn === turn;

                return (
                  <div key={`dist-${turn}`} className="flex items-center gap-2">
                    <span className="w-3 text-right font-bold text-gray-400">{turn}</span>
                    <div className="flex-1 bg-wordle-elevated rounded overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`py-0.5 px-2 text-right text-xs font-bold rounded transition-all duration-500 ${
                          isCurrentWin
                            ? 'bg-wordle-green text-white font-extrabold shadow'
                            : count > 0
                            ? 'bg-wordle-keyDefault text-white'
                            : 'bg-wordle-elevated text-gray-400'
                        }`}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Share Button if Game Completed */}
        {isGameCompleted && (
          <button
            onClick={() => {
              onClose();
              onOpenShare();
            }}
            className="w-full py-2.5 px-4 rounded font-bold uppercase tracking-wider text-xs bg-wordle-green hover:bg-wordle-greenHover text-white flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Share2 className="w-4 h-4" /> Share Score
          </button>
        )}
      </div>
    </div>
  );
};
