import { GameMode } from '../types/game';
import { SOLUTIONS } from './evaluator';

export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailySeed(dateStr: string, mode: string): number {
  const str = `wordle-infinite-${mode.toLowerCase()}-${dateStr}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MODE_COUNTS: Record<GameMode, number> = {
  classic: 1,
  dordle: 2,
  quordle: 4,
  octordle: 8,
  absurdle: 1,
};

export function getDeterministicDailyTargets(dateStr: string, mode: GameMode): string[] {
  const seed = getDailySeed(dateStr, mode);
  const rng = mulberry32(seed);
  const count = MODE_COUNTS[mode] || 1;

  const pool = [...SOLUTIONS];
  const targets: string[] = [];

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(rng() * pool.length);
    targets.push(pool.splice(idx, 1)[0].toUpperCase());
  }

  return targets;
}

export function getRandomTargets(mode: GameMode): string[] {
  const count = MODE_COUNTS[mode] || 1;
  const pool = [...SOLUTIONS];
  const targets: string[] = [];

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    targets.push(pool.splice(idx, 1)[0].toUpperCase());
  }

  return targets;
}
