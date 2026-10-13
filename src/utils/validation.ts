import { GameDuration, GameMode, ScoreEntry } from '../types/game';

export const MAX_NICKNAME_LENGTH = 16;

const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F-\u009F]/;

export interface NicknameValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Validates a player nickname according to event rules:
 * - Trims leading/trailing whitespace
 * - Rejects control characters
 * - Rejects empty strings
 * - Limits length to 16 characters
 */
export function validateNickname(rawInput: string): NicknameValidationResult {
  if (typeof rawInput !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: 'Wprowadź poprawny nick gracza.',
    };
  }

  if (CONTROL_CHAR_REGEX.test(rawInput)) {
    return {
      valid: false,
      sanitized: rawInput.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, MAX_NICKNAME_LENGTH),
      error: 'Nick zawiera niedozwolone znaki sterujące.',
    };
  }

  const trimmed = rawInput.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'Podaj swój nick, aby rozpocząć wyzwanie.',
    };
  }

  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    return {
      valid: false,
      sanitized: trimmed.slice(0, MAX_NICKNAME_LENGTH),
      error: `Nick może mieć maksymalnie ${MAX_NICKNAME_LENGTH} znaków.`,
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

export const NICKNAME_POOL: string[] = [
  'CYBER_WILK',
  'NEON_BYTE',
  'KODER_404',
  'PIXEL_NINJA',
  'TURBO_KEY',
  'QUANTUM_PL',
  'GLITCH_PRO',
  'MATRIX_RUNNER',
  'SYNTAX_HERO',
  'SHADOW_DEV',
  'BINARY_FOX',
  'VECTOR_X',
  'TERMINAL_ACE',
  'KERNEL_BOSS',
  'ZERO_COOL',
  'CRYPTO_KOT',
];

/**
 * Returns `count` distinct nickname suggestions.
 */
export function getNicknameSuggestions(count = 4, offset = 0): string[] {
  const result: string[] = [];
  const start = Math.abs(Math.floor(offset)) % NICKNAME_POOL.length;
  for (let i = 0; i < Math.min(count, NICKNAME_POOL.length); i++) {
    result.push(NICKNAME_POOL[(start + i) % NICKNAME_POOL.length]);
  }
  return result;
}

const VALID_MODES = new Set<GameMode>(['EASY', 'HACKER', 'CODE']);
const VALID_DURATIONS = new Set<GameDuration>([30, 60]);

/**
 * Validates a ScoreEntry to prevent corrupted or invalid records from entering the leaderboard.
 */
export function isValidScoreEntry(entry: unknown): entry is ScoreEntry {
  if (!entry || typeof entry !== 'object') return false;
  const candidate = entry as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0 || candidate.id.length > 64) {
    return false;
  }

  const nickCheck = validateNickname(typeof candidate.nickname === 'string' ? candidate.nickname : '');
  if (!nickCheck.valid) {
    return false;
  }

  if (!VALID_MODES.has(candidate.mode as GameMode)) {
    return false;
  }

  if (!VALID_DURATIONS.has(candidate.duration as GameDuration)) {
    return false;
  }

  const wpm = Number(candidate.wpm);
  const accuracy = Number(candidate.accuracy);
  const errors = Number(candidate.errors);
  const correctChars = Number(candidate.correctChars);
  const totalChars = Number(candidate.totalChars);
  const score = Number(candidate.score);

  if (
    !Number.isFinite(wpm) || wpm < 0 || wpm > 350 ||
    !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100 ||
    !Number.isFinite(errors) || errors < 0 || errors > 10000 ||
    !Number.isFinite(correctChars) || correctChars < 0 || correctChars > 10000 ||
    !Number.isFinite(totalChars) || totalChars < 0 || totalChars > 20000 ||
    !Number.isFinite(score) || score < 0 || score > 100000
  ) {
    return false;
  }

  if (correctChars > totalChars) {
    return false;
  }

  if (typeof candidate.createdAt !== 'string' || Number.isNaN(Date.parse(candidate.createdAt))) {
    return false;
  }

  return true;
}
