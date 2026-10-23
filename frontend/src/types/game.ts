export type TileColor = 'empty' | 'tbd' | 'gray' | 'yellow' | 'green';

export type GameMode = 'classic' | 'dordle' | 'quordle' | 'octordle' | 'absurdle';

export type ChallengeType = 'daily' | 'infinite';

export interface BoardEvaluation {
  targetIndex: number;
  pattern: TileColor[];
  isSolved: boolean;
}

export interface BoardState {
  targetIndex: number;
  targetWord: string;
  guesses: string[];
  evaluations: TileColor[][];
  isSolved: boolean;
  solvedRowIndex: number | null;
}

export interface KeyCapSegment {
  boardIndex: number;
  status: TileColor;
}

export interface EntropyHint {
  word: string;
  entropyBits: number;
  expectedRemaining: number;
  isCandidate: boolean;
  winProbability: number;
}

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
}

export interface GameSettings {
  hardMode: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'error' | 'success';
}
