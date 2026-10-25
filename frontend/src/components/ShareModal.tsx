import React, { useState } from 'react';
import { BoardState, ChallengeType, GameMode } from '../types/game';
import { X, Check, Copy, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  challengeType: ChallengeType;
  dateStr: string;
  dayIndex: number;
  boards: BoardState[];
  maxGuesses: number;
  isWon: boolean;
  onShowToast: (text: string) => void;
}

const COLOR_EMOJI: Record<string, string> = {
  green: '🟩',
  yellow: '🟨',
  gray: '⬛',
  empty: '⬛',
  tbd: '⬛',
};

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  mode,
  challengeType,
  dateStr,
  dayIndex,
  boards,
  maxGuesses,
  isWon,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const modeTitle = mode.charAt(0).toUpperCase() + mode.slice(1);
  const totalGuessesTaken = Math.max(...boards.map((b) => b.guesses.length));

  // Build emoji text
  const generateShareText = (): string => {
    const lines: string[] = [];

    // Header line matching actual Wordle
    if (challengeType === 'daily') {
      lines.push(`ALLDLE (${modeTitle} Daily #${dayIndex})`);
    } else {
      lines.push(`ALLDLE (${modeTitle} Practice)`);
    }

    if (mode === 'classic' || mode === 'absurdle') {
      const score = isWon ? `${totalGuessesTaken}/${maxGuesses === 999 ? '∞' : maxGuesses}` : `X/${maxGuesses}`;
      lines.push(`Result: ${score}\n`);

      const board = boards[0];
      board.evaluations.forEach((row) => {
        lines.push(row.map((c) => COLOR_EMOJI[c] || '⬛').join(''));
      });
    } else {
      // Multi-grid (Dordle, Quordle, Octordle)
      const boardScores = boards
        .map((b, i) => `${NUMBER_EMOJIS[i] || i + 1} ${b.isSolved ? b.guesses.length : 'X'}/${maxGuesses}`)
        .join('  ');
      lines.push(boardScores + '\n');

      const maxRows = Math.max(...boards.map((b) => b.evaluations.length));
      for (let r = 0; r < maxRows; r++) {
        const rowEmojis = boards.map((b) => {
          if (r < b.evaluations.length) {
            return b.evaluations[r].map((c) => COLOR_EMOJI[c] || '⬛').join('');
          }
          if (b.isSolved) {
            return '🟩🟩🟩🟩🟩';
          }
          return '⬛⬛⬛⬛⬛';
        });
        lines.push(rowEmojis.join('  '));
      }
    }

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://alldle-khaki.vercel.app';
    lines.push(`\nPlay: ${appUrl}`);
    return lines.join('\n');
  };

  const shareText = generateShareText();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onShowToast('Copied results to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Failed to copy to clipboard');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ALLDLE Score',
          text: shareText,
        });
        return;
      } catch {}
    }
    handleCopy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-sm bg-wordle-card border border-wordle-border rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-wordle-border">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-wordle-green" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Share Results
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Preview Box */}
        <div className="my-4 p-4 rounded-lg bg-wordle-elevated border border-wordle-border font-mono text-center text-sm leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
          {shareText}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3 px-4 rounded font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-wordle-green hover:bg-wordle-greenHover text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Text
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="py-3 px-4 rounded font-bold uppercase tracking-wider text-xs bg-wordle-border hover:bg-wordle-borderLight text-white flex items-center justify-center gap-1.5 transition-colors"
              title="Share with Apps"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
