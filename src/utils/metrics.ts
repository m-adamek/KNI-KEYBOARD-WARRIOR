import { GameDuration, GameMode, LiveGameMetrics, ScoreEntry } from '../types/game';

export interface PassageProgress {
  correctChars: number;
  errors: number;
  totalChars: number;
  isComplete: boolean;
  charStates: Array<'correct' | 'error' | 'pending'>;
}

/**
 * Evaluates the currently typed string against the target passage text.
 *
 * Rules:
 * - Nothing is normalized silently: exact 1:1 character comparison (case-sensitive & diacritic-sensitive).
 * - Clamps evaluation to target.length (prevents typing beyond the end of the passage).
 * - Supports natural backspace: deleting an incorrect character removes the error from the current buffer.
 */
export function evaluatePassageInput(typed: string, target: string): PassageProgress {
  const clampedTyped = typed.slice(0, target.length);
  let correctChars = 0;
  let errors = 0;
  const charStates: Array<'correct' | 'error' | 'pending'> = new Array(target.length).fill(
    'pending'
  );

  for (let i = 0; i < clampedTyped.length; i++) {
    if (clampedTyped[i] === target[i]) {
      correctChars++;
      charStates[i] = 'correct';
    } else {
      errors++;
      charStates[i] = 'error';
    }
  }

  return {
    correctChars,
    errors,
    totalChars: clampedTyped.length,
    isComplete: target.length > 0 && clampedTyped.length >= target.length,
    charStates,
  };
}

/**
 * Calculates Words Per Minute (WPM) using the standard convention:
 *   1 word = 5 correctly typed characters
 *   WPM = (correctChars / 5) / (elapsedMs / 60000)
 *
 * Uses actual elapsed game time rather than assuming the full session duration.
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (correctChars <= 0 || elapsedMs <= 0 || !Number.isFinite(correctChars) || !Number.isFinite(elapsedMs)) {
    return 0;
  }
  const words = correctChars / 5;
  const elapsedMinutes = elapsedMs / 60_000;
  const rawWpm = words / elapsedMinutes;
  return Math.max(0, Math.round(rawWpm));
}

/**
 * Calculates typing accuracy as a percentage (0.0 to 100.0, rounded to 1 decimal place):
 *   Accuracy = (correctChars / totalChars) * 100
 *
 * Returns 100 when totalChars === 0 (start of session before any mistakes).
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) {
    return 100;
  }
  const safeCorrect = Math.max(0, Math.min(correctChars, totalChars));
  const rawPercentage = (safeCorrect / totalChars) * 100;
  return Math.round(rawPercentage * 10) / 10;
}

/**
 * Calculates the arcade final score combining speed (WPM) and precision (Accuracy^2):
 *   Score = round(WPM * (Accuracy / 100)^2 * 100)
 *
 * Quadratic accuracy weighting ensures careless spamming cannot beat accurate typing.
 */
export function calculateScore(wpm: number, accuracy: number): number {
  if (wpm <= 0 || accuracy <= 0 || !Number.isFinite(wpm) || !Number.isFinite(accuracy)) {
    return 0;
  }
  const clampedAccuracy = Math.max(0, Math.min(100, accuracy));
  const accuracyFactor = clampedAccuracy / 100;
  return Math.round(wpm * accuracyFactor * accuracyFactor * 100);
}

/**
 * Computes combined live metrics across all completed passages in the session plus the active passage.
 */
export function computeSessionMetrics(
  completedPassages: Array<{ correctChars: number; errors: number; totalChars: number }>,
  currentTyped: string,
  currentTarget: string,
  elapsedMs: number,
  durationSeconds: GameDuration
): LiveGameMetrics {
  const active = evaluatePassageInput(currentTyped, currentTarget);

  let totalCorrect = active.correctChars;
  let totalErrors = active.errors;
  let totalTyped = active.totalChars;

  for (const p of completedPassages) {
    totalCorrect += p.correctChars;
    totalErrors += p.errors;
    totalTyped += p.totalChars;
  }

  const totalDurationMs = durationSeconds * 1000;
  const clampedElapsedMs = Math.max(0, Math.min(elapsedMs, totalDurationMs));
  const remainingMs = Math.max(0, totalDurationMs - clampedElapsedMs);

  // Guard against extreme WPM spikes during the first 500ms of typing the very first letter
  const effectiveElapsedForWpm =
    clampedElapsedMs > 0 && clampedElapsedMs < 500 ? 500 : clampedElapsedMs;

  const wpm = calculateWpm(totalCorrect, effectiveElapsedForWpm);
  const accuracy = calculateAccuracy(totalCorrect, totalTyped);
  const score = calculateScore(wpm, accuracy);

  return {
    wpm,
    accuracy,
    errors: totalErrors,
    correctChars: totalCorrect,
    totalChars: totalTyped,
    score,
    elapsedMs: clampedElapsedMs,
    remainingMs,
  };
}

/**
 * Deterministic comparator for leaderboard entries:
 * 1. Primary: numeric final score DESC
 * 2. Tie-breaker 1: accuracy DESC
 * 3. Tie-breaker 2: WPM DESC
 * 4. Tie-breaker 3: fewer errors ASC
 * 5. Tie-breaker 4: earlier timestamp ASC
 */
export function compareScores(a: ScoreEntry, b: ScoreEntry): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.accuracy !== a.accuracy) {
    return b.accuracy - a.accuracy;
  }
  if (b.wpm !== a.wpm) {
    return b.wpm - a.wpm;
  }
  if (a.errors !== b.errors) {
    return a.errors - b.errors;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Sorts and filters leaderboard entries deterministically.
 */
export function filterAndSortScores(
  scores: ScoreEntry[],
  options: {
    mode?: GameMode | 'ALL';
    duration?: GameDuration | 'ALL';
    includeDemo?: boolean;
  } = {}
): ScoreEntry[] {
  const { mode = 'ALL', duration = 'ALL', includeDemo = false } = options;

  return scores
    .filter((entry) => {
      if (!includeDemo && entry.isDemo) return false;
      if (mode !== 'ALL' && entry.mode !== mode) return false;
      if (duration !== 'ALL' && entry.duration !== duration) return false;
      return true;
    })
    .sort(compareScores);
}
