import React from 'react';
import { X, HelpCircle, Sparkles, Brain, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-wordle-card border border-wordle-border rounded-2xl shadow-2xl p-6 overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-wordle-border">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              How to Play & Game Mechanics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs text-gray-300 mt-4 leading-relaxed">
          {/* Rules */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <span>🎯</span> Basic Rules
            </h3>
            <p>
              Guess the secret 5-letter word in a limited number of tries. Each guess must be a
              valid 5-letter word from the 14,855 master dictionary. After each guess, the color of the tiles
              changes to show how close your guess was:
            </p>
            <div className="flex flex-col gap-2 mt-3 p-3 rounded-xl bg-wordle-elevated border border-wordle-border font-sans">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-wordle-green text-white font-black flex items-center justify-center text-sm">
                  W
                </div>
                <span><strong>Green:</strong> Letter is in the word and in the exact correct position.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-wordle-yellow text-white font-black flex items-center justify-center text-sm">
                  I
                </div>
                <span><strong>Yellow:</strong> Letter is in the word but in a different position.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-wordle-gray text-white font-black flex items-center justify-center text-sm">
                  N
                </div>
                <span><strong>Gray:</strong> Letter is not in the word in any remaining position.</span>
              </div>
            </div>
          </div>

          {/* 5 Modalities */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <span>🧩</span> 5 Puzzle Modalities
            </h3>
            <ul className="space-y-2 list-disc pl-4 text-wordle-subtext">
              <li>
                <strong className="text-white">Classic Wordle:</strong> 1 hidden target word, 6 guesses.
              </li>
              <li>
                <strong className="text-white">Dordle:</strong> 2 simultaneous targets, 7 guesses. Keys split vertically into left & right halves.
              </li>
              <li>
                <strong className="text-white">Quordle:</strong> 4 quad targets, 9 guesses. Keys split into 2×2 mini-quadrants.
              </li>
              <li>
                <strong className="text-white">Octordle:</strong> 8 parallel targets, 13 guesses. Keys split into 8 micro-stripes with sticky status ribbon.
              </li>
              <li>
                <strong className="text-white">Absurdle (Adversarial AI):</strong> Does NOT choose a word! Dynamically partitions remaining words into 243 buckets and chooses the largest bucket to evade defeat as long as possible.
              </li>
            </ul>
          </div>

          {/* Shannon Entropy */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
            <h3 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 3Blue1Brown Shannon Entropy AI
            </h3>
            <p className="text-emerald-200/90 text-[11px] leading-relaxed">
              Based on information theory: <em>H(g) = -Σ P(p)·log₂(P(p))</em>. The Shannon Entropy Assistant
              calculates expected bits of information for every possible guess, shrinking candidate words as
              fast as mathematically possible.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 px-4 rounded-xl bg-wordle-border hover:bg-wordle-borderLight text-white font-bold text-xs uppercase tracking-wider transition-colors"
        >
          Got it, Let's Play!
        </button>
      </div>
    </div>
  );
};
