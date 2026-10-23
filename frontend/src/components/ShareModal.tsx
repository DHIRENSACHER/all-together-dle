import React, { useState } from 'react';
import { BoardState, ChallengeType, GameMode } from '../types/game';
import { X, Check, Copy, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  challengeType: ChallengeType;
  dateStr: string;
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

    // Header line
    if (challengeType === 'daily') {
      lines.push(`Wordle Infinite (${modeTitle} Daily #${dateStr})`);
    } else {
      lines.push(`Wordle Infinite (${modeTitle} Practice)`);
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

      // Grid of emoji tiles per turn
      const maxRows = Math.max(...boards.map((b) => b.evaluations.length));
      for (let r = 0; r < maxRows; r++) {
        const rowEmojis = boards.map((b) => {
          if (r < b.evaluations.length) {
            return b.evaluations[r].map((c) => COLOR_EMOJI[c] || '⬛').join('');
          }
          // If solved earlier, fill with green
          if (b.isSolved) {
            return '🟩🟩🟩🟩🟩';
          }
          return '⬛⬛⬛⬛⬛';
        });
        lines.push(rowEmojis.join('  '));
      }
    }

    lines.push('\nPlay: https://wordle-infinite.local');
    return lines.join('\n');
  };

  const shareText = generateShareText();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onShowToast('Copied result to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Failed to copy to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-wordle-card border border-wordle-border rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-wordle-border">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Share Emoji Card
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-wordle-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatted Preview Box */}
        <div className="my-5 p-4 rounded-xl bg-wordle-elevated border border-wordle-border font-mono text-xs text-gray-200 whitespace-pre overflow-x-auto max-h-64">
          {shareText}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-wordle-green hover:bg-wordle-greenHover text-white shadow-wordle-green/20'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Score Card</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
