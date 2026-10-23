import { BoardEvaluation, EntropyHint, GameMode, TileColor } from '../types/game';
import {
  decodePattern,
  evaluateGuess as clientEvaluateGuess,
  evaluatePatternInt,
  isValidWord as clientIsValidWord,
  SOLUTIONS,
} from './evaluator';
import { getDeterministicDailyTargets } from './prng';
import { getClientTopRecommendations } from './entropy';

const API_BASE = '/api/v1';

export async function validateWordApi(word: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/words/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.is_valid;
    }
  } catch {}
  // Offline fallback
  return clientIsValidWord(word);
}

export async function evaluateGuessApi(
  guess: string,
  targets: string[]
): Promise<BoardEvaluation[]> {
  try {
    const res = await fetch(`${API_BASE}/game/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, targets }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.evaluations.map((e: { target_index: number; pattern: TileColor[]; is_solved: boolean }) => ({
        targetIndex: e.target_index,
        pattern: e.pattern,
        isSolved: e.is_solved,
      }));
    }
  } catch {}

  // Offline fallback
  return targets.map((t, idx) => ({
    targetIndex: idx,
    pattern: clientEvaluateGuess(guess, t),
    isSolved: guess.toLowerCase() === t.toLowerCase(),
  }));
}

export async function getDailyTargetsApi(dateStr: string, mode: GameMode): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/game/daily?date=${dateStr}&mode=${mode}`);
    if (res.ok) {
      const data = await res.json();
      return data.targets;
    }
  } catch {}

  // Offline fallback
  return getDeterministicDailyTargets(dateStr, mode);
}

export async function getEntropyHintsApi(
  candidateWords: string[],
  topK: number = 10
): Promise<{ count: number; recommendations: EntropyHint[] }> {
  try {
    const res = await fetch(`${API_BASE}/entropy/hints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_words: candidateWords, top_k: topK }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        count: data.candidate_count,
        recommendations: data.top_recommendations.map(
          (r: {
            word: string;
            entropy_bits: number;
            expected_remaining: number;
            is_candidate: boolean;
            win_probability: number;
          }) => ({
            word: r.word,
            entropyBits: r.entropy_bits,
            expectedRemaining: r.expected_remaining,
            isCandidate: r.is_candidate,
            winProbability: r.win_probability,
          })
        ),
      };
    }
  } catch {}

  // Offline fallback
  const recs = getClientTopRecommendations(candidateWords, topK);
  return {
    count: candidateWords.length,
    recommendations: recs,
  };
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
  try {
    const res = await fetch(`${API_BASE}/absurdle/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, candidate_words: candidateWords }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        chosenPattern: data.chosen_pattern,
        remainingWords: data.remaining_words,
        remainingCount: data.remaining_count,
        isGameWon: data.is_game_won,
      };
    }
  } catch {}

  // Offline fallback
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
