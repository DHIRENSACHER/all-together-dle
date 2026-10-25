import React from 'react';
import { ChallengeType, GameMode } from '../types/game';
import {
  Volume2,
  VolumeX,
  BarChart2,
  HelpCircle,
  RotateCcw,
  Flame,
  Calendar,
  Infinity as InfinityIcon,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  challengeType: ChallengeType;
  onToggleChallengeType: () => void;
  hardMode: boolean;
  onToggleHardMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  onRestartGame: () => void;
  currentStreak: number;
  dayIndex: number;
  isDailyDone: boolean;
}

const MODES: Array<{ id: GameMode; label: string; desc: string }> = [
  { id: 'classic', label: 'Classic', desc: '1 Board • 6 Tries' },
  { id: 'dordle', label: 'Dordle', desc: '2 Boards • 7 Tries' },
  { id: 'quordle', label: 'Quordle', desc: '4 Boards • 9 Tries' },
  { id: 'octordle', label: 'Octordle', desc: '8 Boards • 13 Tries' },
  { id: 'absurdle', label: 'Absurdle', desc: 'Adversarial AI' },
];

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSelectMode,
  challengeType,
  onToggleChallengeType,
  hardMode,
  onToggleHardMode,
  soundEnabled,
  onToggleSound,
  onOpenStats,
  onOpenHelp,
  onRestartGame,
  currentStreak,
  dayIndex,
  isDailyDone,
}) => {
  const modeTitle = mode.charAt(0).toUpperCase() + mode.slice(1);

  return (
    <header className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-2 pb-2 flex flex-col gap-1.5 border-b border-wordle-border select-none">
      {/* Top Navbar */}
      <div className="flex items-center justify-between h-11">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={onOpenHelp}
            className="p-1.5 sm:p-2 rounded text-gray-400 hover:text-white hover:bg-wordle-card transition-colors"
            title="How to Play & Rules"
            aria-label="How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Daily vs Practice Mode Switcher */}
          <button
            onClick={onToggleChallengeType}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-wordle-card border border-wordle-border hover:border-wordle-borderLight text-gray-300 transition-colors shadow-sm"
            title={`Switch to ${challengeType === 'daily' ? 'Practice Mode (Unlimited)' : 'Daily Challenge'}`}
          >
            {challengeType === 'daily' ? (
              <>
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Daily</span>
                {isDailyDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </>
            ) : (
              <>
                <InfinityIcon className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-400 font-bold">Practice</span>
              </>
            )}
          </button>

          {mode !== 'octordle' && mode !== 'absurdle' && (
            <button
              onClick={onToggleHardMode}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border transition-colors ${
                hardMode
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                  : 'bg-wordle-card text-gray-400 border-wordle-border hover:text-white'
              }`}
              title="Toggle Hard Mode"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hard</span>
            </button>
          )}
        </div>

        {/* Center Title & Daily Puzzle Badge */}
        <div className="text-center flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase font-sans leading-none">
            ALLDLE
          </h1>
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-wordle-subtext mt-0.5">
            {challengeType === 'daily' ? (
              <span className="text-emerald-400">Daily</span>
            ) : (
              <span className="text-sky-400">Practice</span>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 sm:p-2 rounded text-gray-400 hover:text-white hover:bg-wordle-card transition-colors"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="p-1.5 sm:p-2 rounded text-gray-400 hover:text-white hover:bg-wordle-card transition-colors flex items-center gap-1"
            title="View Statistics & Streak"
            aria-label="Statistics"
          >
            <BarChart2 className="w-5 h-5" />
            {currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-extrabold text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {currentStreak}
              </span>
            )}
          </button>

          {/* Reset / New Game (Only enabled in Practice mode, or to view modal in daily) */}
          <button
            onClick={onRestartGame}
            className="p-1.5 sm:p-2 rounded text-gray-400 hover:text-white hover:bg-wordle-card transition-colors"
            title={challengeType === 'daily' ? 'View Daily Game' : 'New Practice Game'}
            aria-label="Restart / New Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modality Selector Tabs */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs sm:text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-wordle-green text-white shadow'
                  : 'bg-wordle-card/80 text-gray-400 hover:text-white hover:bg-wordle-border border border-wordle-border/40'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
