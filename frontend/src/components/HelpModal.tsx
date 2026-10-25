import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-md max-h-[90vh] bg-wordle-card border border-wordle-border rounded-xl shadow-2xl p-6 overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-wordle-border">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-wordle-green" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              How to Play
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 mt-4 leading-relaxed">
          {/* Rules */}
          <div>
            <p className="mb-2">
              Guess the secret word in 6 tries (or more for multi-grid modes).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300 text-xs">
              <li>Each guess must be a valid 5-letter word.</li>
              <li>The color of the tiles will change to show how close your guess was to the word.</li>
            </ul>

            <div className="flex flex-col gap-2 mt-4 p-3 rounded-lg bg-wordle-elevated border border-wordle-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[2px] bg-wordle-green text-white font-extrabold flex items-center justify-center text-base">
                  W
                </div>
                <span><strong>Green:</strong> In the word and in the correct spot.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[2px] bg-wordle-yellow text-white font-extrabold flex items-center justify-center text-base">
                  I
                </div>
                <span><strong>Yellow:</strong> In the word but in the wrong spot.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[2px] bg-wordle-gray text-white font-extrabold flex items-center justify-center text-base">
                  N
                </div>
                <span><strong>Gray:</strong> Not in the word in any spot.</span>
              </div>
            </div>
          </div>

          {/* Modalities */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-2">
              Game Modes
            </h3>
            <div className="space-y-1.5 text-xs text-wordle-subtext">
              <p><strong className="text-white">Classic Wordle:</strong> 1 hidden word, 6 guesses.</p>
              <p><strong className="text-white">Dordle:</strong> 2 words at once, 7 guesses. Keyboard keys split in two.</p>
              <p><strong className="text-white">Quordle:</strong> 4 words at once, 9 guesses. Keys split into 4 quadrants.</p>
              <p><strong className="text-white">Octordle:</strong> 8 words at once, 13 guesses. Keys show 8 vertical stripes.</p>
              <p><strong className="text-white">Absurdle:</strong> Adversarial AI that actively changes the word to evade you!</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded font-extrabold uppercase tracking-wide bg-wordle-green hover:bg-wordle-greenHover text-white transition-colors"
        >
          Got It!
        </button>
      </div>
    </div>
  );
};
