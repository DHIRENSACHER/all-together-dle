import { BoardState, GameMode, GameStats } from '../types/game';

const STATS_KEY_PREFIX = 'alldle_stats_';
const DAILY_COMPLETED_KEY = 'alldle_daily_completed_';
const DAILY_STATE_PREFIX = 'alldle_daily_state_';

export interface SavedDailyState {
  dateStr: string;
  mode: GameMode;
  boards: BoardState[];
  isGameOver: boolean;
  isGameWon: boolean;
  lastSolvedTurn: number | null;
  hardMode: boolean;
  absurdlePool?: string[];
}

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
  },
};

export function loadStats(mode: GameMode): GameStats {
  try {
    const raw = localStorage.getItem(`${STATS_KEY_PREFIX}${mode}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATS,
        ...parsed,
        guessDistribution: {
          ...DEFAULT_STATS.guessDistribution,
          ...(parsed.guessDistribution || {}),
        },
      };
    }
  } catch {}
  return { ...DEFAULT_STATS };
}

export function saveGameResult(mode: GameMode, won: boolean, guessCount: number): GameStats {
  const stats = loadStats(mode);
  stats.played++;
  if (won) {
    stats.won++;
    stats.currentStreak++;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1;
  } else {
    stats.currentStreak = 0;
  }

  try {
    localStorage.setItem(`${STATS_KEY_PREFIX}${mode}`, JSON.stringify(stats));
  } catch {}

  return stats;
}

export function isDailyCompleted(dateStr: string, mode: GameMode): boolean {
  try {
    return localStorage.getItem(`${DAILY_COMPLETED_KEY}${mode}_${dateStr}`) === 'true';
  } catch {
    return false;
  }
}

export function markDailyCompleted(dateStr: string, mode: GameMode) {
  try {
    localStorage.setItem(`${DAILY_COMPLETED_KEY}${mode}_${dateStr}`, 'true');
  } catch {}
}

export function saveDailyState(state: SavedDailyState) {
  try {
    localStorage.setItem(
      `${DAILY_STATE_PREFIX}${state.mode}_${state.dateStr}`,
      JSON.stringify(state)
    );
  } catch {}
}

export function loadDailyState(dateStr: string, mode: GameMode): SavedDailyState | null {
  try {
    const raw = localStorage.getItem(`${DAILY_STATE_PREFIX}${mode}_${dateStr}`);
    if (raw) {
      return JSON.parse(raw) as SavedDailyState;
    }
  } catch {}
  return null;
}
