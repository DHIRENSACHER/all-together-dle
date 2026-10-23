import { EntropyHint } from '../types/game';
import { evaluatePatternInt, SOLUTIONS_SET } from './evaluator';
import openingEntropyJson from '../data/opening_entropy.json';

interface RawOpeningEntropy {
  word: string;
  entropy_bits: number;
  expected_remaining: number;
  is_candidate: boolean;
  win_probability: number;
}

const OPENING_ENTROPY: EntropyHint[] = (openingEntropyJson as RawOpeningEntropy[]).map((item) => ({
  word: item.word,
  entropyBits: item.entropy_bits,
  expectedRemaining: item.expected_remaining,
  isCandidate: item.is_candidate,
  winProbability: item.win_probability,
}));

export function calculateWordEntropy(
  guess: string,
  candidates: string[]
): { entropyBits: number; expectedRemaining: number; isCandidate: boolean; winProbability: number } {
  const total = candidates.length;
  if (total <= 1) {
    const isCand = candidates.map((c) => c.toLowerCase()).includes(guess.toLowerCase());
    return {
      entropyBits: 0,
      expectedRemaining: total,
      isCandidate: isCand,
      winProbability: isCand && total === 1 ? 1 : 0,
    };
  }

  const buckets = new Int32Array(243);
  const g = guess.toLowerCase();
  for (let i = 0; i < total; i++) {
    const pat = evaluatePatternInt(g, candidates[i]);
    buckets[pat]++;
  }

  let entropy = 0;
  let expectedRemaining = 0;
  for (let i = 0; i < 243; i++) {
    const count = buckets[i];
    if (count > 0) {
      const prob = count / total;
      entropy -= prob * Math.log2(prob);
      expectedRemaining += prob * count;
    }
  }

  const isCandidate = SOLUTIONS_SET.has(g);
  const winProbability = isCandidate ? 1 / total : 0;

  return {
    entropyBits: Math.round(entropy * 1000) / 1000,
    expectedRemaining: Math.round(expectedRemaining * 10) / 10,
    isCandidate,
    winProbability: Math.round(winProbability * 10000) / 10000,
  };
}

export function getClientTopRecommendations(
  candidates: string[],
  topK: number = 10
): EntropyHint[] {
  const total = candidates.length;
  if (total === 2315) {
    return OPENING_ENTROPY.slice(0, topK);
  }

  if (total === 0) return [];

  if (total === 1) {
    return [
      {
        word: candidates[0].toUpperCase(),
        entropyBits: 0,
        expectedRemaining: 1,
        isCandidate: true,
        winProbability: 1,
      },
    ];
  }

  const wordsToTest = new Set<string>(candidates.map((c) => c.toLowerCase()));

  // Add top opener words if candidate pool is small (helps solve rhyming traps)
  if (total <= 60) {
    OPENING_ENTROPY.slice(0, 20).forEach((op) => wordsToTest.add(op.word.toLowerCase()));
  }

  const results: Array<EntropyHint & { _score: number }> = [];

  wordsToTest.forEach((w) => {
    const stats = calculateWordEntropy(w, candidates);
    const score = stats.entropyBits + (stats.winProbability * 0.1);
    results.push({
      word: w.toUpperCase(),
      entropyBits: stats.entropyBits,
      expectedRemaining: stats.expectedRemaining,
      isCandidate: stats.isCandidate,
      winProbability: stats.winProbability,
      _score: score,
    });
  });

  results.sort((a, b) => b._score - a._score);

  return results.slice(0, topK).map(({ _score, ...rest }) => rest);
}
