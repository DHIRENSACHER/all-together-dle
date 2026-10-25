import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  BoardState,
  ChallengeType,
  GameMode,
  GameStats,
  ToastMessage,
} from './types/game';
import { sound } from './services/audio';
import {
  absurdleGuessApi,
  evaluateGuessApi,
  getDailyTargetsApi,
  validateHardModeLocal,
  validateWordApi,
} from './services/api';
import { SOLUTIONS } from './services/evaluator';
import { getTodayDateStr, getDayIndex, getRandomTargets } from './services/prng';
import {
  isDailyCompleted,
  loadDailyState,
  loadStats,
  markDailyCompleted,
  saveDailyState,
  saveGameResult,
} from './services/storage';
import { Header } from './components/Header';
import { BoardGrid } from './components/BoardGrid';
import { Keyboard } from './components/Keyboard';
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

const WORDLE_PRAISE: Record<number, string> = {
  1: 'Genius',
  2: 'Magnificent',
  3: 'Impressive',
  4: 'Splendid',
  5: 'Great',
  6: 'Phew',
};

export const App: React.FC = () => {
  // Game Configuration State
  const [mode, setMode] = useState<GameMode>('classic');
  const [challengeType, setChallengeType] = useState<ChallengeType>('daily');
  const [hardMode, setHardMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);

  // Active Game State
  const [boards, setBoards] = useState<BoardState[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [winningRows, setWinningRows] = useState<Record<number, number>>({});
  const [lastSolvedTurn, setLastSolvedTurn] = useState<number | null>(null);

  // Absurdle Specific State
  const [absurdlePool, setAbsurdlePool] = useState<string[]>(SOLUTIONS);

  // Modals & UI State
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const todayStr = useMemo(() => getTodayDateStr(), []);
  const dayIndex = useMemo(() => getDayIndex(), []);
  const maxGuesses = MAX_GUESSES_PER_MODE[mode];

  // Helper to display toast notifications
  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
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
      sound.playInvalidShake();
      showToast('Hard mode can only be enabled at start of round', 'error');
      return;
    }
    setHardMode((prev) => {
      const next = !prev;
      showToast(next ? 'Hard Mode Enabled 🛡️' : 'Hard Mode Disabled');
      return next;
    });
  };

  // Initialize or Restore a Game
  const startNewGame = useCallback(
    async (targetMode: GameMode = mode, targetChallenge: ChallengeType = challengeType) => {
      setCurrentInput('');
      setIsRevealing(false);
      setRevealingRow(null);
      setIsShaking(false);

      // Check if there is an in-progress or completed Daily game saved in localStorage for today
      if (targetChallenge === 'daily') {
        const saved = loadDailyState(todayStr, targetMode);
        if (saved) {
          setBoards(saved.boards);
          setIsGameOver(saved.isGameOver);
          setIsGameWon(saved.isGameWon);
          setLastSolvedTurn(saved.lastSolvedTurn);
          setHardMode(saved.hardMode);
          if (saved.absurdlePool) {
            setAbsurdlePool(saved.absurdlePool);
          }

          if (saved.isGameOver) {
            showToast(`Today's ${targetMode.toUpperCase()} is completed!`);
          }
          return;
        }

        // Fresh daily game: deterministic word(s) matching actual Wordle
        const targetWords = await getDailyTargetsApi(todayStr, targetMode);
        const initialBoards: BoardState[] = targetWords.map((word, idx) => ({
          targetIndex: idx,
          targetWord: word.toUpperCase(),
          guesses: [],
          evaluations: [],
          isSolved: false,
          solvedRowIndex: null,
        }));

        setBoards(initialBoards);
        setIsGameOver(false);
        setIsGameWon(false);
        setWinningRows({});
        setLastSolvedTurn(null);
        setAbsurdlePool(SOLUTIONS);

        saveDailyState({
          dateStr: todayStr,
          mode: targetMode,
          boards: initialBoards,
          isGameOver: false,
          isGameWon: false,
          lastSolvedTurn: null,
          hardMode,
        });
        return;
      }

      // Practice Mode (Infinite): fresh random target words
      let targetWords: string[] = [];
      if (targetMode === 'absurdle') {
        targetWords = ['?????'];
        setAbsurdlePool(SOLUTIONS);
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
      setIsGameOver(false);
      setIsGameWon(false);
      setWinningRows({});
      setLastSolvedTurn(null);
    },
    [mode, challengeType, todayStr, hardMode, showToast]
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
    showToast(
      nextType === 'daily'
        ? `Switched to Daily #${dayIndex} 📅`
        : 'Switched to Practice Mode (Unlimited) ♾️'
    );
  };

  // Switch directly from modal to practice mode
  const handleSwitchToPractice = () => {
    setChallengeType('infinite');
    startNewGame(mode, 'infinite');
    showToast('Switched to Practice Mode (Unlimited) ♾️');
  };

  // Mount effect: Start game on first render
  useEffect(() => {
    startNewGame();
  }, []);

  // Trigger Victory Celebrations
  const triggerVictory = (finalTurn: number, newlySolvedWins: Record<number, number>) => {
    setIsGameOver(true);
    setIsGameWon(true);
    setLastSolvedTurn(finalTurn);
    setWinningRows(newlySolvedWins);

    sound.playVictoryFanfare();

    // Wordle Praise Toast
    const praise =
      mode === 'classic'
        ? WORDLE_PRAISE[finalTurn] || 'Splendid'
        : 'Magnificent!';
    showToast(praise, 'success');

    // Confetti cannon
    try {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#538d4e', '#b59f3b', '#ffffff'],
      });
    } catch {}

    // Save statistics & mark daily completed
    saveGameResult(mode, true, finalTurn);
    if (challengeType === 'daily') {
      markDailyCompleted(todayStr, mode);
    }

    // Delay modal so user can enjoy their solved grid
    setTimeout(() => {
      setIsStatsOpen(true);
    }, 1800);
  };

  // Trigger Defeat
  const triggerDefeat = (finalBoards: BoardState[]) => {
    setIsGameOver(true);
    setIsGameWon(false);
    sound.playDefeatThud();

    saveGameResult(mode, false, maxGuesses);
    if (challengeType === 'daily') {
      markDailyCompleted(todayStr, mode);
    }

    // Show solution
    if (mode === 'classic' && finalBoards[0]?.targetWord) {
      showToast(finalBoards[0].targetWord, 'info');
    } else {
      showToast('Game Over', 'error');
    }

    setTimeout(() => {
      setIsStatsOpen(true);
    }, 2000);
  };

  // Handle Key Input
  const handleKey = (char: string) => {
    if (isGameOver || isRevealing) return;
    if (currentInput.length < 5) {
      setCurrentInput((prev) => prev + char.toUpperCase());
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    if (isGameOver || isRevealing) return;
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  // Handle Guess Submission (ENTER)
  const handleEnter = async () => {
    if (isGameOver || isRevealing) {
      if (isGameOver && challengeType === 'daily') {
        showToast("Today's Daily is completed! Switch to Practice mode to keep playing.");
      }
      return;
    }

    // 1. Length Validation
    if (currentInput.length < 5) {
      sound.playInvalidShake();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Not enough letters', 'error');
      return;
    }

    const guess = currentInput.toUpperCase();

    // 2. Master 14,855 Dictionary Validation
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
            showToast(errorMessage || 'Must use previously revealed hints', 'error');
            return;
          }
        }
      }
    }

    // Lock keyboard input during the 1.5s tile reveal animation
    setIsRevealing(true);
    const currentRowIdx = boards[0]?.guesses.length || 0;
    setRevealingRow(currentRowIdx);
    setCurrentInput('');

    // Absurdle Modality
    if (mode === 'absurdle') {
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

      const updatedBoards = [nextBoard];
      setBoards(updatedBoards);

      if (challengeType === 'daily') {
        saveDailyState({
          dateStr: todayStr,
          mode,
          boards: updatedBoards,
          isGameOver: absurdleWon,
          isGameWon: absurdleWon,
          lastSolvedTurn: absurdleWon ? nextBoard.guesses.length : null,
          hardMode,
          absurdlePool: remainingWords,
        });
      }

      setTimeout(() => {
        setIsRevealing(false);
        setRevealingRow(null);

        if (absurdleWon) {
          triggerVictory(nextBoard.guesses.length, { 0: currentRowIdx });
        }
      }, 1500);
      return;
    }

    // Multi-Grid Parallel Evaluation (Classic, Dordle, Quordle, Octordle)
    const activeTargets = boards.map((b) => b.targetWord);
    const evaluations = await evaluateGuessApi(guess, activeTargets);

    let allSolved = true;
    const newWins: Record<number, number> = { ...winningRows };

    const nextBoards: BoardState[] = boards.map((board, idx) => {
      if (board.isSolved) {
        return board; // Keep frozen
      }

      const ev = evaluations[idx];
      const newlySolved = ev.isSolved || guess === board.targetWord;
      const updatedGuesses = [...board.guesses, guess];
      const updatedEvals = [...board.evaluations, ev.pattern];

      if (newlySolved) {
        newWins[board.targetIndex] = currentRowIdx;
      } else {
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

    const turnCount = Math.max(...nextBoards.map((b) => b.guesses.length));
    const gameFinished = allSolved || turnCount >= maxGuesses;

    // Persist daily state on every turn
    if (challengeType === 'daily') {
      saveDailyState({
        dateStr: todayStr,
        mode,
        boards: nextBoards,
        isGameOver: gameFinished,
        isGameWon: allSolved,
        lastSolvedTurn: allSolved ? turnCount : null,
        hardMode,
      });
    }

    // After flip animation concludes:
    setTimeout(() => {
      setIsRevealing(false);
      setRevealingRow(null);

      if (allSolved) {
        triggerVictory(turnCount, newWins);
      } else if (turnCount >= maxGuesses) {
        triggerDefeat(nextBoards);
      }
    }, 1500);
  };

  const currentStats: GameStats = useMemo(() => loadStats(mode), [mode, isGameOver]);
  const isDailyDone = useMemo(() => isDailyCompleted(todayStr, mode), [mode, todayStr, isGameOver]);

  const handleRestartClick = () => {
    if (challengeType === 'daily') {
      if (isGameOver) {
        setIsStatsOpen(true);
      } else {
        showToast(`Playing Daily #${dayIndex}. Complete today's puzzle or switch to Practice mode!`);
      }
    } else {
      startNewGame(mode, 'infinite');
      showToast('Started new practice game! 🎲');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-wordle-dark text-white font-sans overflow-x-hidden selection:bg-wordle-green selection:text-white">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Header & Navigation */}
      <Header
        mode={mode}
        onSelectMode={handleSelectMode}
        challengeType={challengeType}
        onToggleChallengeType={handleToggleChallengeType}
        hardMode={hardMode}
        onToggleHardMode={toggleHardMode}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onRestartGame={handleRestartClick}
        currentStreak={currentStats.currentStreak}
        dayIndex={dayIndex}
        isDailyDone={isDailyDone}
      />

      {/* Main Boards Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-2 sm:px-4 py-2 sm:py-4 overflow-y-auto">
        <BoardGrid
          mode={mode}
          boards={boards}
          currentInput={currentInput}
          isGameOver={isGameOver}
          isShaking={isShaking}
          maxGuesses={maxGuesses}
          revealingRow={revealingRow}
          winningRows={winningRows}
          absurdleCandidateCount={mode === 'absurdle' ? absurdlePool.length : undefined}
        />
      </main>

      {/* Bottom Adaptive Keyboard */}
      <footer className="w-full pb-3 pt-1 border-t border-wordle-border/40 bg-wordle-dark/95 backdrop-blur-sm sticky bottom-0 z-30">
        <Keyboard
          mode={mode}
          boards={boards}
          onKey={handleKey}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          disabled={isGameOver || isRevealing}
        />
      </footer>

      {/* Statistics & Win Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={currentStats}
        mode={mode}
        challengeType={challengeType}
        maxGuesses={maxGuesses}
        lastSolvedTurn={lastSolvedTurn}
        onOpenShare={() => setIsShareOpen(true)}
        onSwitchToPractice={handleSwitchToPractice}
        isGameCompleted={isGameOver}
      />

      {/* Social Emoji Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        mode={mode}
        challengeType={challengeType}
        dateStr={todayStr}
        dayIndex={dayIndex}
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
