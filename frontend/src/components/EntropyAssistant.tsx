import React from 'react';
import { EntropyHint } from '../types/game';
import { Sparkles, X, ArrowRight, Brain, Info, CheckCircle2 } from 'lucide-react';

interface EntropyAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  candidateCount: number;
  hints: EntropyHint[];
  isLoading: boolean;
  onApplyWord: (word: string) => void;
}

export const EntropyAssistant: React.FC<EntropyAssistantProps> = ({
  isOpen,
  onClose,
  candidateCount,
  hints,
  isLoading,
  onApplyWord,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div className="relative w-full max-w-md h-full bg-wordle-card border-l border-wordle-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-wordle-border bg-wordle-elevated/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Shannon Entropy Assistant
              </h2>
              <p className="text-xs text-wordle-subtext">3Blue1Brown Information Theory Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Math & Stats Overview */}
        <div className="p-4 bg-wordle-card border-b border-wordle-border flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-wordle-elevated border border-wordle-border">
              <span className="text-[11px] font-medium text-wordle-subtext block">
                Remaining Candidates
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {candidateCount.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-wordle-elevated border border-wordle-border">
              <span className="text-[11px] font-medium text-wordle-subtext block">
                Top Expected Info
              </span>
              <span className="text-2xl font-black font-mono text-amber-400">
                {hints.length > 0 ? `${hints[0].entropyBits.toFixed(2)}` : '0.00'}
                <span className="text-xs font-normal text-wordle-subtext ml-1">bits</span>
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-200/90 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Shannon Entropy Formula:</strong> <em>H(g) = -Σ P(p)·log₂(P(p))</em>.
              Measures bits of information expected to eliminate the maximum number of words.
            </span>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-wordle-subtext mb-1">
            Top Recommended Guesses
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-wordle-subtext">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Computing 243 pattern buckets...</span>
            </div>
          ) : hints.length === 0 ? (
            <div className="text-center py-12 text-sm text-wordle-subtext">
              No candidates remaining or already solved.
            </div>
          ) : (
            hints.map((hint, idx) => (
              <div
                key={hint.word}
                className="group p-3 rounded-xl bg-wordle-elevated/70 border border-wordle-border hover:border-wordle-green/50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-mono text-xs font-bold text-gray-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-base tracking-wider text-white">
                        {hint.word}
                      </span>
                      {hint.isCandidate ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" /> Candidate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
                          <Brain className="w-3 h-3" /> Splitter
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-wordle-subtext font-mono">
                      <span>
                        <strong className="text-amber-400 font-bold">{hint.entropyBits.toFixed(2)}</strong> bits
                      </span>
                      <span>•</span>
                      <span>
                        Leaves <strong className="text-gray-300">~{hint.expectedRemaining}</strong> words
                      </span>
                      {hint.winProbability > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {(hint.winProbability * 100).toFixed(1)}% win
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onApplyWord(hint.word);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-wordle-border hover:bg-wordle-green text-xs font-bold text-white transition-all flex items-center gap-1 opacity-90 group-hover:opacity-100"
                  title="Apply guess to active board"
                >
                  <span>Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-wordle-border bg-wordle-card text-center text-xs text-wordle-subtext">
          Wordle Infinite Real-Time Solver
        </div>
      </div>
    </div>
  );
};
