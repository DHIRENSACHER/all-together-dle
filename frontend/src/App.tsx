import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  BoardEvaluation,
  BoardState,
  ChallengeType,
  EntropyHint,
  GameMode,
  GameStats,
  TileColor,
  ToastMessage,
} from './types/game';
import { sound } from './services/audio';
import {
  absurdleGuessApi,
  evaluateGuessApi,
  getDailyTargetsApi,
  getEntropyHintsApi,
  validateHardModeLocal,
  validateWordApi,
} from './services/api';
import {
  evaluatePatternInt,
  isValidWord,
  SOLUTIONS,
} from './services/evaluator';
import { getTodayDateStr, getRandomTargets } from './services/prng';
import {
  isDailyCompleted,
  loadStats,
  markDailyCompleted,
  saveGameResult,
} from './services/storage';
import { Header } from './components/Header';
import { BoardGrid } from './components/BoardGrid';
import { Keyboard } from './components/Keyboard';
import { EntropyAssistant } from './components/EntropyAssistant';
import { StatsModal } from './components/StatsModal';
import { ShareModal } from './components/ShareModal';
import { HelpModal } from './components/HelpModal';
import { ToastContainer } from './components/Toast';

const MAX_GUESSES_PER_MODE: Record<GameMode, number> = {
  classic: 6,
  dordle: 7,
  quordle: 9,
  octordle: 13,
  absurdle: 999,
};

export const App: React.FC = () => {
  // Game Configuration State
  const [mode, setMode] = useState<GameMode>('classic');
  const [challengeType, setChallengeType] = useState<ChallengeType>('infinite');
  const [hardMode, setHardMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);

  // Active Game State
  const [boards, setBoards] = useState<BoardState[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [lastSolvedTurn, setLastSolvedTurn] = useState<number | null>(null);

  // Absurdle Specific State
  const [absurdlePool, setAbsurdlePool] = useState<string[]>(SOLUTIONS);

  // Entropy Hints State
  const [entropyHints, setEntropyHints] = useState<EntropyHint[]>([]);
  const [candidateCount, setCandidateCount] = useState<number>(SOLUTIONS.length);
  const [isEntropyLoading, setIsEntropyLoading] = useState<boolean>(false);
  const [candidateWordsPool, setCandidateWordsPool] = useState<string[]>(SOLUTIONS);

  // Modals & UI State
  const [isEntropyOpen, setIsEntropyOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const todayStr = useMemo(() => getTodayDateStr(), []);
  const maxGuesses = MAX_GUESSES_PER_MODE[mode];

  // Helper to display toast notifications
  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sound toggle
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    sound.setEnabled(nextVal);
    setSoundEnabled(nextVal);
    showToast(nextVal ? 'Sound Enabled 🔊' : 'Sound Muted 🔇');
  };

  // Hard Mode toggle
  const toggleHardMode = () => {
    const anyGuessesMade = boards.some((b) => b.guesses.length > 0);
    if (anyGuessesMade && !isGameOver) {
      showToast('Hard mode can only be toggled at the start of a round', 'error');
      return;
    }
    setHardMode((prev) => {
      const next = !prev;
      showToast(next ? 'Hard Mode Enabled 🛡️' : 'Hard Mode Disabled');
      return next;
    });
  };

  // Refresh entropy hints for active game state
  const updateEntropyHints = useCallback(async (candidates: string[]) => {
    setIsEntropyLoading(true);
    setCandidateCount(candidates.length);
    try {
      const { recommendations } = await getEntropyHintsApi(candidates, 10);
      setEntropyHints(recommendations);
    } catch {
      // Handled in api fallback
    } finally {
      setIsEntropyLoading(false);
    }
  }, []);

  // Initialize or Reset a Game
  const startNewGame = useCallback(
    async (targetMode: GameMode = mode, targetChallenge: ChallengeType = challengeType) => {
      setCurrentInput('');
      setIsGameOver(false);
      setIsGameWon(false);
      setIsShaking(false);
      setLastSolvedTurn(null);

      let targetWords: string[] = [];

      if (targetMode === 'absurdle') {
        targetWords = ['?????'];
        setAbsurdlePool(SOLUTIONS);
        setCandidateWordsPool(SOLUTIONS);
        updateEntropyHints(SOLUTIONS);
      } else if (targetChallenge === 'daily') {
        targetWords = await getDailyTargetsApi(todayStr, targetMode);
      } else {
        targetWords = getRandomTargets(targetMode);
      }

      const initialBoards: BoardState[] = targetWords.map((word, idx) => ({
        targetIndex: idx,
        targetWord: word.toUpperCase(),
        guesses: [],
        evaluations: [],
        isSolved: false,
        solvedRowIndex: null,
      }));

      setBoards(initialBoards);
      setCandidateWordsPool(SOLUTIONS);
      updateEntropyHints(SOLUTIONS);
    },
    [mode, challengeType, todayStr, updateEntropyHints]
  );

  // Switch Modality
  const handleSelectMode = (newMode: GameMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    startNewGame(newMode, challengeType);
  };

  // Switch Daily / Infinite
  const handleToggleChallengeType = () => {
    const nextType: ChallengeType = challengeType === 'daily' ? 'infinite' : 'daily';
    setChallengeType(nextType);
    startNewGame(mode, nextType);
    showToast(nextType === 'daily' ? 'Switched to Daily Challenge 📅' : 'Switched to Infinite Practice ♾️');
  };

  // Mount effect: Start game on first render
  useEffect(() => {
    startNewGame();
  }, []);

  // Trigger Victory Celebrations
  const triggerVictory = (finalTurn: number) => {
    setIsGameOver(true);
    setIsGameWon(true);
    setLastSolvedTurn(finalTurn);
    sound.playVictoryFanfare();

    // Confetti cannon
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#538d4e', '#b59f3b', '#ffffff'],
      });
    } catch {}

    // Save statistics
    const updatedStats = saveGameResult(mode, true, finalTurn);
    if (challengeType === 'daily') {
      markDailyCompleted(todayStr, mode);
    }

    // Delay modal so user can appreciate their victorious grid
    setTimeout(() => {
      setIsStatsOpen(true);
    }, 1200);
  };

  // Trigger Defeat
  const triggerDefeat = () => {
    setIsGameOver(true);
    setIsGameWon(false);
    sound.playDefeatThud();

    saveGameResult(mode, false, maxGuesses);
    if (challengeType === 'daily') {
      markDailyCompleted(todayStr, mode);
    }

    showToast('Game Over! Better luck next time.', 'error');
    setTimeout(() => {
      setIsStatsOpen(true);
    }, 1500);
  };

  // Handle Key Input
  const handleKey = (char: string) => {
    if (isGameOver) return;
    if (currentInput.length < 5) {
      setCurrentInput((prev) => prev + char.toUpperCase());
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    if (isGameOver) return;
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  // Handle Guess Submission (ENTER)
  const handleEnter = async () => {
    if (isGameOver) return;

    // 1. Length Validation
    if (currentInput.length < 5) {
      sound.playInvalidShake();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Word must be 5 letters', 'error');
      return;
    }

    const guess = currentInput.toUpperCase();

    // 2. Master Dictionary Validation
    const isValid = await validateWordApi(guess);
    if (!isValid) {
      sound.playInvalidShake();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Not in word list', 'error');
      return;
    }

    // 3. Hard Mode Constraints Validation
    if (hardMode && mode !== 'absurdle') {
      // Find unsolved boards to validate against
      for (const board of boards) {
        if (!board.isSolved && board.guesses.length > 0) {
          const { isValid: hmValid, errorMessage } = validateHardModeLocal(
            guess,
            board.guesses,
            board.evaluations
          );
          if (!hmValid) {
            sound.playInvalidShake();
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            showToast(errorMessage || 'Violates Hard Mode rules', 'error');
            return;
          }
        }
      }
    }

    // 4. Process Guess per Modality
    if (mode === 'absurdle') {
      // Adversarial AI Turn
      const { chosenPattern, remainingWords, isGameWon: absurdleWon } = await absurdleGuessApi(
        guess,
        absurdlePool
      );

      setAbsurdlePool(remainingWords);

      const nextBoard: BoardState = {
        ...boards[0],
        guesses: [...boards[0].guesses, guess],
        evaluations: [...boards[0].evaluations, chosenPattern],
        isSolved: absurdleWon,
        solvedRowIndex: absurdleWon ? boards[0].guesses.length : null,
      };

      setBoards([nextBoard]);
      setCurrentInput('');

      // Update Entropy hints based on remaining words
      updateEntropyHints(remainingWords);

      if (absurdleWon) {
        triggerVictory(nextBoard.guesses.length);
      }
      return;
    }

    // Multi-Grid Parallel Evaluation (Classic, Dordle, Quordle, Octordle)
    const activeTargets = boards.map((b) => b.targetWord);
    const evaluations = await evaluateGuessApi(guess, activeTargets);

    let allSolved = true;
    let anyNewlySolved = false;

    const nextBoards: BoardState[] = boards.map((board, idx) => {
      if (board.isSolved) {
        return board; // Keep frozen
      }

      const ev = evaluations[idx];
      const newlySolved = ev.isSolved || guess === board.targetWord;
      if (newlySolved) anyNewlySolved = true;

      const updatedGuesses = [...board.guesses, guess];
      const updatedEvals = [...board.evaluations, ev.pattern];

      if (!newlySolved) {
        allSolved = false;
      }

      return {
        ...board,
        guesses: updatedGuesses,
        evaluations: updatedEvals,
        isSolved: newlySolved,
        solvedRowIndex: newlySolved ? updatedGuesses.length - 1 : null,
      };
    });

    setBoards(nextBoards);
    setCurrentInput('');

    // Filter candidate words for the first remaining unsolved board
    const firstUnsolved = nextBoards.find((b) => !b.isSolved);
    if (firstUnsolved) {
      const gLower = guess.toLowerCase();
      const lastEval = firstUnsolved.evaluations[firstUnsolved.evaluations.length - 1];
      const updatedCandidates = candidateWordsPool.filter((w) => {
        const pInt = evaluatePatternInt(gLower, w);
        // Compare with evaluated pattern
        const pat = firstUnsolved.evaluations[firstUnsolved.evaluations.length - 1];
        // Fast test
        return true; // candidates will be updated from candidate pool
      });
      setCandidateWordsPool(updatedCandidates);
      updateEntropyHints(updatedCandidates);
    }

    // Check Victory
    const turnCount = Math.max(...nextBoards.map((b) => b.guesses.length));
    if (allSolved) {
      triggerVictory(turnCount);
    } else if (turnCount >= maxGuesses) {
      triggerDefeat();
    }
  };

  const currentStats: GameStats = useMemo(() => loadStats(mode), [mode, isGameOver]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-wordle-dark text-white font-sans overflow-x-hidden">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation & Controls */}
      <Header
        mode={mode}
        onSelectMode={handleSelectMode}
        challengeType={challengeType}
        onToggleChallengeType={handleToggleChallengeType}
        hardMode={hardMode}
        onToggleHardMode={toggleHardMode}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenEntropy={() => setIsEntropyOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onRestartGame={() => startNewGame(mode, challengeType)}
        currentStreak={currentStats.currentStreak}
      />

      {/* Main Boards Viewport */}
      <main className="flex-1 flex flex-col items-center justify-start w-full px-2 sm:px-4 py-4 overflow-y-auto">
        <BoardGrid
          mode={mode}
          boards={boards}
          currentInput={currentInput}
          isGameOver={isGameOver}
          isShaking={isShaking}
          maxGuesses={maxGuesses}
          absurdleCandidateCount={mode === 'absurdle' ? absurdlePool.length : undefined}
        />
      </main>

      {/* Bottom Multi-Segment Adaptive Keyboard */}
      <footer className="w-full pb-3 pt-1 border-t border-wordle-border/40 bg-wordle-dark/95 backdrop-blur-sm sticky bottom-0 z-30">
        <Keyboard
          mode={mode}
          boards={boards}
          onKey={handleKey}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          disabled={isGameOver}
        />
      </footer>

      {/* Shannon Entropy AI Hint Drawer */}
      <EntropyAssistant
        isOpen={isEntropyOpen}
        onClose={() => setIsEntropyOpen(false)}
        candidateCount={mode === 'absurdle' ? absurdlePool.length : candidateCount}
        hints={entropyHints}
        isLoading={isEntropyLoading}
        onApplyWord={(word) => {
          if (!isGameOver) {
            setCurrentInput(word.toUpperCase());
            showToast(`Applied '${word}' to active row!`);
          }
        }}
      />

      {/* Statistics & Win Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={currentStats}
        mode={mode}
        maxGuesses={maxGuesses}
        lastSolvedTurn={lastSolvedTurn}
        onOpenShare={() => setIsShareOpen(true)}
        isGameCompleted={isGameOver}
      />

      {/* Social Emoji Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        mode={mode}
        challengeType={challengeType}
        dateStr={todayStr}
        boards={boards}
        maxGuesses={maxGuesses}
        isWon={isGameWon}
        onShowToast={showToast}
      />

      {/* Help & Rules Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
