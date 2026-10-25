import { BoardEvaluation, GameMode, TileColor } from '../types/game';
import {
  decodePattern,
  evaluateGuess as clientEvaluateGuess,
  evaluatePatternInt,
  isValidWord as clientIsValidWord,
  SOLUTIONS,
} from './evaluator';
import { getDeterministicDailyTargets } from './prng';

export async function validateWordApi(word: string): Promise<boolean> {
  return clientIsValidWord(word);
}

export async function evaluateGuessApi(
  guess: string,
  targets: string[]
): Promise<BoardEvaluation[]> {
  return targets.map((t, idx) => ({
    targetIndex: idx,
    pattern: clientEvaluateGuess(guess, t),
    isSolved: guess.toLowerCase() === t.toLowerCase(),
  }));
}

export async function getDailyTargetsApi(dateStr: string, mode: GameMode): Promise<string[]> {
  return getDeterministicDailyTargets(dateStr, mode);
}

export async function absurdleGuessApi(
  guess: string,
  candidateWords: string[]
): Promise<{
  chosenPattern: TileColor[];
  remainingWords: string[];
  remainingCount: number;
  isGameWon: boolean;
}> {
  const g = guess.toLowerCase();
  if (candidateWords.length === 1 && candidateWords[0].toLowerCase() === g) {
    return {
      chosenPattern: ['green', 'green', 'green', 'green', 'green'],
      remainingWords: candidateWords,
      remainingCount: 1,
      isGameWon: true,
    };
  }

  const buckets: Record<number, string[]> = {};
  for (const w of candidateWords) {
    const pat = evaluatePatternInt(g, w);
    if (!buckets[pat]) buckets[pat] = [];
    buckets[pat].push(w);
  }

  let maxSize = 0;
  Object.values(buckets).forEach((b) => {
    if (b.length > maxSize) maxSize = b.length;
  });

  const largestKeys = Object.keys(buckets)
    .map(Number)
    .filter((k) => buckets[k].length === maxSize);

  // Minimax tie breaker: min greens, min yellows, min index
  function cost(patInt: number) {
    const pat = decodePattern(patInt);
    const greens = pat.filter((c) => c === 'green').length;
    const yellows = pat.filter((c) => c === 'yellow').length;
    return greens * 1000 + yellows * 10 + patInt * 0.001;
  }

  largestKeys.sort((a, b) => cost(a) - cost(b));
  const bestPat = largestKeys[0];
  const chosenPattern = decodePattern(bestPat);
  const remaining = buckets[bestPat] || [];

  return {
    chosenPattern,
    remainingWords: remaining,
    remainingCount: remaining.length,
    isGameWon: bestPat === 242,
  };
}

export function validateHardModeLocal(
  currentGuess: string,
  priorGuesses: string[],
  priorEvaluations: TileColor[][]
): { isValid: boolean; errorMessage?: string } {
  const g = currentGuess.toLowerCase();
  const requiredGreens: Record<number, string> = {};
  const requiredYellows = new Set<string>();

  for (let round = 0; round < priorGuesses.length; round++) {
    const word = priorGuesses[round].toLowerCase();
    const ev = priorEvaluations[round];
    for (let i = 0; i < 5; i++) {
      if (ev[i] === 'green') {
        requiredGreens[i] = word[i];
      } else if (ev[i] === 'yellow') {
        requiredYellows.add(word[i]);
      }
    }
  }

  for (const [idxStr, char] of Object.entries(requiredGreens)) {
    const idx = Number(idxStr);
    if (g[idx] !== char) {
      return {
        isValid: false,
        errorMessage: `Position ${idx + 1} must be '${char.toUpperCase()}'`,
      };
    }
  }

  for (const char of requiredYellows) {
    if (!g.includes(char)) {
      return {
        isValid: false,
        errorMessage: `Guess must contain '${char.toUpperCase()}'`,
      };
    }
  }

  return { isValid: true };
}
