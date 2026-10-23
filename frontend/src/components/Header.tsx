import React from 'react';
import { ChallengeType, GameMode } from '../types/game';
import {
  Volume2,
  VolumeX,
  Sparkles,
  BarChart2,
  HelpCircle,
  RotateCcw,
  Flame,
  Calendar,
  Infinity as InfinityIcon,
  ShieldAlert,
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
  onOpenEntropy: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  onRestartGame: () => void;
  currentStreak: number;
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
  onOpenEntropy,
  onOpenStats,
  onOpenHelp,
  onRestartGame,
  currentStreak,
}) => {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 border-b border-wordle-border select-none">
      {/* Top Navbar */}
      <div className="flex items-center justify-between">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-card border border-transparent hover:border-wordle-border transition-colors"
            title="How to Play & Rules"
            aria-label="How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleChallengeType}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-wordle-card border border-wordle-border hover:border-wordle-borderLight text-gray-300 transition-colors"
            title={`Switch to ${challengeType === 'daily' ? 'Infinite Practice' : 'Daily Challenge'}`}
          >
            {challengeType === 'daily' ? (
              <>
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Daily</span>
              </>
            ) : (
              <>
                <InfinityIcon className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-400">Practice</span>
              </>
            )}
          </button>

          {mode !== 'octordle' && mode !== 'absurdle' && (
            <button
              onClick={onToggleHardMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
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

        {/* Center Title */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5 font-sans">
            <span className="text-wordle-green">WORDLE</span>
            <span className="text-white">INFINITE</span>
          </h1>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Shannon Entropy Drawer Button */}
          <button
            onClick={onOpenEntropy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/40 transition-colors shadow-sm"
            title="Open Shannon Entropy AI Hints"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">AI Hints</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-card border border-transparent hover:border-wordle-border transition-colors"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-card border border-transparent hover:border-wordle-border transition-colors flex items-center gap-1"
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

          {/* Reset / New Game */}
          <button
            onClick={onRestartGame}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-card border border-transparent hover:border-wordle-border transition-colors"
            title="Restart / New Game"
            aria-label="New Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modality Selector Tabs */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-1">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-wordle-green text-white shadow-md shadow-wordle-green/20'
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
