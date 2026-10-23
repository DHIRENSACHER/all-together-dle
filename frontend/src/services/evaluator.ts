import { TileColor } from '../types/game';
import solutionsJson from '../data/words_solutions.json';
import guessesJson from '../data/words_guesses.json';

export const SOLUTIONS: string[] = (solutionsJson as string[]).map((w) => w.toLowerCase());
export const GUESSES: string[] = (guessesJson as string[]).map((w) => w.toLowerCase());

export const SOLUTIONS_SET = new Set<string>(SOLUTIONS);
export const ALL_WORDS_SET = new Set<string>([...SOLUTIONS, ...GUESSES]);

const COLOR_MAP: Record<number, TileColor> = {
  0: 'gray',
  1: 'yellow',
  2: 'green',
};

const POWERS_OF_3 = [1, 3, 9, 27, 81];

/**
 * Strict two-pass duplicate letter resolution algorithm.
 * Guarantees zero coloring bugs with duplicate letters (ABBEY vs BABES).
 */
export function evaluateGuess(guess: string, target: string): TileColor[] {
  const g = guess.toLowerCase();
  const t = target.toLowerCase();
  const result: TileColor[] = ['gray', 'gray', 'gray', 'gray', 'gray'];
  const targetCounts: Record<string, number> = {};

  for (let i = 0; i < 5; i++) {
    const c = t[i];
    targetCounts[c] = (targetCounts[c] || 0) + 1;
  }

  // PASS 1: Identify greens
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = 'green';
      targetCounts[g[i]]--;
    }
  }

  // PASS 2: Identify yellows
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'green') {
      const c = g[i];
      if ((targetCounts[c] || 0) > 0) {
        result[i] = 'yellow';
        targetCounts[c]--;
      } else {
        result[i] = 'gray';
      }
    }
  }

  return result;
}

export function evaluatePatternInt(guess: string, target: string): number {
  const g = guess.toLowerCase();
  const t = target.toLowerCase();
  const res: number[] = [0, 0, 0, 0, 0];
  const targetCounts: Record<string, number> = {};

  for (let i = 0; i < 5; i++) {
    const c = t[i];
    targetCounts[c] = (targetCounts[c] || 0) + 1;
  }

  // Pass 1: Greens
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      res[i] = 2;
      targetCounts[g[i]]--;
    }
  }

  // Pass 2: Yellows
  for (let i = 0; i < 5; i++) {
    if (res[i] === 0) {
      const c = g[i];
      if ((targetCounts[c] || 0) > 0) {
        res[i] = 1;
        targetCounts[c]--;
      }
    }
  }

  let val = 0;
  for (let i = 0; i < 5; i++) {
    val += res[i] * POWERS_OF_3[i];
  }
  return val;
}

export function decodePattern(patternInt: number): TileColor[] {
  let p = patternInt;
  const res: TileColor[] = [];
  for (let i = 0; i < 5; i++) {
    res.push(COLOR_MAP[p % 3]);
    p = Math.floor(p / 3);
  }
  return res;
}

export function isValidWord(word: string): boolean {
  if (word.length !== 5) return false;
  return ALL_WORDS_SET.has(word.toLowerCase());
}
