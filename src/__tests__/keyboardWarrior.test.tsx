import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PASSAGES, selectNextPassage } from '../data/passages';
import {
  calculateAccuracy,
  calculateScore,
  calculateWpm,
  compareScores,
  computeSessionMetrics,
  evaluatePassageInput,
  filterAndSortScores,
} from '../utils/metrics';
import { isValidScoreEntry, validateNickname } from '../utils/validation';
import { createLeaderboardStorage, STORAGE_KEY } from '../services/storage';
import { GameScreen } from '../components/GameScreen';
import { LeaderboardScreen } from '../components/LeaderboardScreen';
import { App } from '../App';
import { ScoreEntry } from '../types/game';

describe('KEYBOARD WARRIOR — Automated Test Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // 1. WPM calculation at different elapsed times
  describe('1. WPM Calculation at Different Elapsed Times', () => {
    it('calculates WPM accurately for 15s, 30s, and 60s elapsed durations (5 chars = 1 word)', () => {
      // 100 correct chars = 20 words
      // In 60,000ms (1 min) => 20 WPM
      expect(calculateWpm(100, 60_000)).toBe(20);
      // In 30,000ms (0.5 min) => 40 WPM
      expect(calculateWpm(100, 30_000)).toBe(40);
      // In 15,000ms (0.25 min) => 80 WPM
      expect(calculateWpm(100, 15_000)).toBe(80);
    });

    it('returns 0 WPM when elapsed time or character count is 0 or negative', () => {
      expect(calculateWpm(0, 30_000)).toBe(0);
      expect(calculateWpm(50, 0)).toBe(0);
      expect(calculateWpm(-10, 15_000)).toBe(0);
    });
  });

  // 2. Accuracy calculation for correct input, mistakes, and corrections
  describe('2. Accuracy Calculation & Backspace Corrections', () => {
    it('calculates 100% accuracy for flawless input and exact percentage with mistakes', () => {
      expect(calculateAccuracy(0, 0)).toBe(100);
      expect(calculateAccuracy(50, 50)).toBe(100);
      expect(calculateAccuracy(45, 50)).toBe(90);
      expect(calculateAccuracy(19, 20)).toBe(95);
    });

    it('recalculates accuracy and errors naturally when mistakes are corrected with Backspace', () => {
      const target = 'Każdy wielki projekt';

      // Step A: Type 4 correct chars + 1 mistake ('Każdx')
      const withMistake = evaluatePassageInput('Każdx', target);
      expect(withMistake.correctChars).toBe(4);
      expect(withMistake.errors).toBe(1);
      expect(calculateAccuracy(withMistake.correctChars, withMistake.totalChars)).toBe(80);

      // Step B: Player presses Backspace ('Każd')
      const afterBackspace = evaluatePassageInput('Każd', target);
      expect(afterBackspace.correctChars).toBe(4);
      expect(afterBackspace.errors).toBe(0);
      expect(calculateAccuracy(afterBackspace.correctChars, afterBackspace.totalChars)).toBe(100);

      // Step C: Player types the right character ('Każdy')
      const afterCorrection = evaluatePassageInput('Każdy', target);
      expect(afterCorrection.correctChars).toBe(5);
      expect(afterCorrection.errors).toBe(0);
      expect(calculateAccuracy(afterCorrection.correctChars, afterCorrection.totalChars)).toBe(100);

      // Step D: Combined session metrics across a completed passage + active passage
      const sessionMetrics = computeSessionMetrics(
        [{ correctChars: 45, errors: 5, totalChars: 50 }],
        'Każdy',
        target,
        30_000,
        30
      );
      expect(sessionMetrics.correctChars).toBe(50);
      expect(sessionMetrics.errors).toBe(5);
      expect(sessionMetrics.totalChars).toBe(55);
    });
  });

  // 3. Passage completion and transition to the next passage
  describe('3. Passage Completion & Seamless Multi-Passage Transition', () => {
    it('selects distinct passages deterministically without immediate repetition', () => {
      const first = selectNextPassage('EASY', [], 0);
      const second = selectNextPassage('EASY', [first.id], 0);
      const third = selectNextPassage('EASY', [first.id, second.id], 0);

      expect(first.id).not.toBe(second.id);
      expect(second.id).not.toBe(third.id);
    });

    it('transitions immediately to the next passage in GameScreen upon completing current passage without resetting timer', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();
      const firstPassage = PASSAGES.CODE[0];
      const secondPassage = PASSAGES.CODE[1];

      render(
        <GameScreen
          sessionId="test-transition-1"
          nickname="TESTER"
          mode="CODE"
          duration={30}
          sessionSeed={0}
          onGameComplete={onComplete}
          onAbortToSetup={() => {}}
        />
      );

      const input = screen.getByTestId('typing-input') as HTMLInputElement;

      // Type the first character to start timer
      fireEvent.change(input, { target: { value: firstPassage.text.slice(0, 1) } });

      // Advance timer by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('hud-timer').textContent).toBe('25.0s');

      // Now complete the entire first passage
      fireEvent.change(input, { target: { value: firstPassage.text } });

      // Input should reset to empty for the second passage, while timer remains at 25.0s
      expect(input.value).toBe('');
      expect(screen.getByTestId('hud-timer').textContent).toBe('25.0s');
      expect(screen.getByTestId('passage-display').textContent).toBe(secondPassage.text);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  // 4. Timer expiration and prevention of duplicate completion
  describe('4. Timer Expiration & Single-Completion Guard', () => {
    it('does not start the timer until the first character is typed, and fires onGameComplete exactly once when time expires', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();

      render(
        <GameScreen
          sessionId="test-timer-once"
          nickname="NEO"
          mode="EASY"
          duration={30}
          sessionSeed={0}
          onGameComplete={onComplete}
          onAbortToSetup={() => {}}
        />
      );

      // Advance 10s before typing anything — timer must still be 30.0s
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(screen.getByTestId('hud-timer').textContent).toBe('30.0s');
      expect(onComplete).not.toHaveBeenCalled();

      // Type 10 correct characters to start timer
      const input = screen.getByTestId('typing-input');
      const targetPrefix = PASSAGES.EASY[0].text.slice(0, 10);
      fireEvent.change(input, { target: { value: targetPrefix } });

      // Advance full 30 seconds + extra 5 seconds
      act(() => {
        vi.advanceTimersByTime(35_000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].correctChars).toBe(10);
    });
  });

  // 5. Score calculation and leaderboard tie-breaking
  describe('5. Score Calculation & Leaderboard Tie-Breaking', () => {
    it('calculates score rewarding both speed and quadratic accuracy', () => {
      // 80 WPM at 100% accuracy => 8000
      expect(calculateScore(80, 100)).toBe(8000);
      // 80 WPM at 50% accuracy => 80 * 0.25 * 100 = 2000
      expect(calculateScore(80, 50)).toBe(2000);
    });

    it('breaks ties deterministically by accuracy first, then WPM, then fewer errors', () => {
      const baseEntry: ScoreEntry = {
        id: '1',
        nickname: 'A',
        mode: 'EASY',
        duration: 30,
        wpm: 75,
        accuracy: 95,
        errors: 5,
        correctChars: 180,
        totalChars: 185,
        score: 7000,
        createdAt: '2026-10-13T10:00:00.000Z',
      };

      const higherAccuracyTie: ScoreEntry = {
        ...baseEntry,
        id: '2',
        nickname: 'B',
        accuracy: 98.5,
        wpm: 72,
        score: 7000, // Same primary score
      };

      const higherWpmTie: ScoreEntry = {
        ...baseEntry,
        id: '3',
        nickname: 'C',
        accuracy: 98.5, // Same accuracy as B
        wpm: 76, // Higher WPM than B
        score: 7000,
      };

      const sorted = [baseEntry, higherAccuracyTie, higherWpmTie].sort(compareScores);
      expect(sorted.map((s) => s.nickname)).toEqual(['C', 'B', 'A']);
    });
  });

  // 6. Nickname validation
  describe('6. Nickname Validation & Sanitization', () => {
    it('trims whitespace, enforces 1-16 chars, and rejects empty or control-character strings', () => {
      expect(validateNickname('  CYBER_MAX  ')).toEqual({
        valid: true,
        sanitized: 'CYBER_MAX',
      });

      expect(validateNickname('   ').valid).toBe(false);
      expect(validateNickname('').valid).toBe(false);
      expect(validateNickname('A_VERY_LONG_NICKNAME_OVER_16').valid).toBe(false);
      expect(validateNickname('HACKER\u0007BELL').valid).toBe(false);
      expect(validateNickname('LINE\nBREAK').valid).toBe(false);
    });
  });

  // 7. Persistence across reloads
  describe('7. Leaderboard Persistence Across Reloads', () => {
    it('persists saved scores in localStorage and restores them in a new service instance', async () => {
      const storageInstance1 = createLeaderboardStorage(false);

      const sampleEntry: ScoreEntry = {
        id: 'persist-run-1',
        nickname: 'WARRIOR_PL',
        mode: 'HACKER',
        duration: 30,
        wpm: 88,
        accuracy: 99.0,
        errors: 2,
        correctChars: 220,
        totalChars: 222,
        score: 8625,
        createdAt: new Date().toISOString(),
      };

      const res = await storageInstance1.saveScore(sampleEntry);
      expect(res.saved).toBe(true);
      expect(res.duplicate).toBe(false);

      // Simulate page reload by creating a brand new storage instance reading from window.localStorage
      const storageInstance2 = createLeaderboardStorage(false);
      const loadedScores = storageInstance2.getScores(false);

      expect(loadedScores).toHaveLength(1);
      expect(loadedScores[0].nickname).toBe('WARRIOR_PL');
      expect(loadedScores[0].score).toBe(8625);
    });
  });

  // 8. Filtering leaderboard records by mode and duration
  describe('8. Filtering Leaderboard Records by Mode & Duration', () => {
    const sampleScores: ScoreEntry[] = [
      {
        id: 's1',
        nickname: 'EASY_30',
        mode: 'EASY',
        duration: 30,
        wpm: 60,
        accuracy: 100,
        errors: 0,
        correctChars: 150,
        totalChars: 150,
        score: 6000,
        createdAt: '2026-10-13T09:00:00.000Z',
      },
      {
        id: 's2',
        nickname: 'HACKER_60',
        mode: 'HACKER',
        duration: 60,
        wpm: 75,
        accuracy: 98,
        errors: 4,
        correctChars: 375,
        totalChars: 379,
        score: 7203,
        createdAt: '2026-10-13T09:05:00.000Z',
      },
      {
        id: 's3',
        nickname: 'CODE_30',
        mode: 'CODE',
        duration: 30,
        wpm: 70,
        accuracy: 96,
        errors: 7,
        correctChars: 175,
        totalChars: 182,
        score: 6451,
        createdAt: '2026-10-13T09:10:00.000Z',
      },
    ];

    it('filters accurately by mode and duration in both utility and LeaderboardScreen UI', () => {
      expect(filterAndSortScores(sampleScores, { mode: 'HACKER' })).toHaveLength(1);
      expect(filterAndSortScores(sampleScores, { duration: 30 })).toHaveLength(2);
      expect(filterAndSortScores(sampleScores, { mode: 'CODE', duration: 60 })).toHaveLength(0);

      render(
        <LeaderboardScreen
          scores={sampleScores}
          latestScoreId="s2"
          activeNickname="HACKER_60"
          includeDemo={false}
          onStartChallenge={() => {}}
          onReturnHome={() => {}}
        />
      );

      // Initially ALL modes & durations are shown
      expect(screen.getByText('EASY_30')).toBeInTheDocument();
      expect(screen.getByText('HACKER_60')).toBeInTheDocument();
      expect(screen.getByText('CODE_30')).toBeInTheDocument();

      // Click filter for CODE MODE
      fireEvent.click(screen.getByRole('button', { name: 'CODE MODE' }));
      expect(screen.getByText('CODE_30')).toBeInTheDocument();
      expect(screen.queryByText('EASY_30')).not.toBeInTheDocument();
    });
  });

  // 9. Handling empty leaderboards and unavailable storage
  describe('9. Empty Leaderboards & Unavailable Storage Fallback', () => {
    it('renders a clean empty state and falls back to memory when localStorage throws', async () => {
      // Simulate corrupted JSON in localStorage
      window.localStorage.setItem(STORAGE_KEY, '{corrupted-json');
      const storage = createLeaderboardStorage(false);
      expect(storage.getScores()).toEqual([]);

      // Simulate localStorage throwing SecurityError on setItem/getItem
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage disabled');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      const fallbackStorage = createLeaderboardStorage(false);
      const entry: ScoreEntry = {
        id: 'mem-1',
        nickname: 'MEM_USER',
        mode: 'EASY',
        duration: 30,
        wpm: 50,
        accuracy: 100,
        errors: 0,
        correctChars: 125,
        totalChars: 125,
        score: 5000,
        createdAt: new Date().toISOString(),
      };

      const saved = await fallbackStorage.saveScore(entry);
      expect(saved.saved).toBe(true);
      expect(fallbackStorage.getBackendStatus()).toBe('memory-fallback');
      expect(fallbackStorage.getScores()).toHaveLength(1);
    });

    it('rejects corrupted or out-of-bounds score payloads', () => {
      expect(
        isValidScoreEntry({
          id: 'bad-1',
          nickname: 'HACKER',
          mode: 'EASY',
          duration: 30,
          wpm: 9999, // impossible WPM > 350
          accuracy: 100,
          errors: 0,
          correctChars: 100,
          totalChars: 100,
          score: 5000,
          createdAt: new Date().toISOString(),
        })
      ).toBe(false);
    });
  });

  // 10. Prevention of duplicate score submissions
  describe('10. Prevention of Duplicate Score Submissions', () => {
    it('prevents duplicate score entries with the same session ID from being stored twice', async () => {
      const storage = createLeaderboardStorage(false);
      const entry: ScoreEntry = {
        id: 'unique-session-999',
        nickname: 'NO_DUPES',
        mode: 'CODE',
        duration: 30,
        wpm: 77,
        accuracy: 97.5,
        errors: 3,
        correctChars: 192,
        totalChars: 195,
        score: 7320,
        createdAt: new Date().toISOString(),
      };

      const firstAttempt = await storage.saveScore(entry);
      const secondAttempt = await storage.saveScore(entry);

      expect(firstAttempt.saved).toBe(true);
      expect(firstAttempt.duplicate).toBe(false);

      expect(secondAttempt.saved).toBe(false);
      expect(secondAttempt.duplicate).toBe(true);
      expect(storage.getScores()).toHaveLength(1);
    });

    it('supports full user journey from Home -> Setup -> Game -> Results -> Leaderboard in App', async () => {
      vi.useFakeTimers();
      const isolatedStorage = createLeaderboardStorage(false);
      render(<App storage={isolatedStorage} />);

      // Screen A: Home screen
      expect(screen.getAllByText(/Mniej klikania\. Więcej kodowania\./i).length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Przepisz tekst jak najszybciej i jak najdokładniej\. Zdobądź miejsce w rankingu\./i)
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /START CHALLENGE/i }));

      // Screen B: Setup screen
      const nickInput = screen.getByLabelText(/IDENTYFIKATOR GRACZA/i);
      fireEvent.change(nickInput, { target: { value: 'KNI_MASTER' } });
      fireEvent.click(screen.getByRole('button', { name: /^START$/i }));

      // Screen C: Active game screen
      const typingInput = screen.getByTestId('typing-input');
      const targetText = PASSAGES.EASY[0].text.slice(0, 25);
      fireEvent.change(typingInput, { target: { value: targetText } });

      // Expire the 30s timer
      await act(async () => {
        vi.advanceTimersByTime(30_100);
      });

      // Screen D: Results screen
      expect(screen.getByTestId('result-final-score')).toBeInTheDocument();
      expect(screen.getByTestId('result-wpm').textContent).toBe('10 WPM');

      // Navigate to Leaderboard and verify KNI_MASTER is persisted & displayed
      const leaderboardBtns = screen.getAllByRole('button', { name: /^LEADERBOARD$/i });
      fireEvent.click(leaderboardBtns[leaderboardBtns.length - 1]);
      expect(screen.getByText('KNI_MASTER')).toBeInTheDocument();
      expect(screen.getByText('TWÓJ WYNIK')).toBeInTheDocument();
    });

    it('supports playing again with same nickname, clearing nickname for next player, and playing HACKER and CODE modes', async () => {
      vi.useFakeTimers();
      const isolatedStorage = createLeaderboardStorage(false);
      render(<App storage={isolatedStorage} />);

      // Start challenge -> Setup
      fireEvent.click(screen.getByRole('button', { name: /START CHALLENGE/i }));
      const nickInput = screen.getByLabelText(/IDENTYFIKATOR GRACZA/i) as HTMLInputElement;
      fireEvent.change(nickInput, { target: { value: 'CYBER_ANNA' } });

      // Select CODE MODE
      fireEvent.click(screen.getByRole('radio', { name: /CODE MODE/i }));
      fireEvent.click(screen.getByRole('button', { name: /^START$/i }));

      // Verify CODE MODE passage is loaded and type 15 chars
      const typingInput = screen.getByTestId('typing-input');
      expect(screen.getByTestId('passage-display').textContent).toBe(PASSAGES.CODE[0].text);
      fireEvent.change(typingInput, { target: { value: PASSAGES.CODE[0].text.slice(0, 15) } });

      await act(async () => {
        vi.advanceTimersByTime(30_100);
      });

      // On Results screen, click ZAGRAJ PONOWNIE (same player)
      const playAgainBtn = screen.getByRole('button', { name: /ZAGRAJ PONOWNIE \(CYBER_ANNA\)/i });
      fireEvent.click(playAgainBtn);

      // Should immediately start a new game session with the next passage in CODE MODE
      expect(screen.getByTestId('passage-display').textContent).toBe(PASSAGES.CODE[1].text);
      const secondTypingInput = screen.getByTestId('typing-input');
      fireEvent.change(secondTypingInput, { target: { value: PASSAGES.CODE[1].text.slice(0, 20) } });

      await act(async () => {
        vi.advanceTimersByTime(30_100);
      });

      // Now click NASTĘPNY GRACZ and verify previous player's nickname is cleared
      fireEvent.click(screen.getByRole('button', { name: /NASTĘPNY GRACZ/i }));
      const nextPlayerNickInput = screen.getByLabelText(/IDENTYFIKATOR GRACZA/i) as HTMLInputElement;
      expect(nextPlayerNickInput.value).toBe('');
    });
  });
});
