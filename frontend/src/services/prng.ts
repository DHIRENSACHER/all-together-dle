import { GameMode } from '../types/game';
import { SOLUTIONS } from './evaluator';

export const WORDLE_EPOCH = new Date(2021, 5, 19, 0, 0, 0, 0); // June 19, 2021

export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayIndex(date: Date = new Date()): number {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - WORDLE_EPOCH.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export function getTimeUntilMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const diff = Math.max(0, tomorrow.getTime() - now.getTime());

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const MODE_COUNTS: Record<GameMode, number> = {
  classic: 1,
  dordle: 2,
  quordle: 4,
  octordle: 8,
  absurdle: 1,
};

const MODE_OFFSETS: Record<GameMode, number> = {
  classic: 0,
  dordle: 101,
  quordle: 202,
  octordle: 303,
  absurdle: 404,
};

/**
 * Deterministically generates synchronized daily target word(s)
 * for the current day index. Every player across the globe gets the exact same word(s).
 */
export function getDeterministicDailyTargets(dateStr: string, mode: GameMode): string[] {
  const dayIndex = getDayIndex();
  const count = MODE_COUNTS[mode] || 1;
  const offset = MODE_OFFSETS[mode] || 0;

  // Use a high-quality prime multiplier for uniform distribution across solution vocabulary
  const seed = ((dayIndex * 7919) + offset) >>> 0;
  const rng = mulberry32(seed);

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
