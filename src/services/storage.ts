import { ScoreEntry } from '../types/game';
import { compareScores } from '../utils/metrics';
import { isValidScoreEntry, validateNickname } from '../utils/validation';

export const STORAGE_KEY = 'kw_leaderboard_v1';

export type StorageBackendStatus = 'server-sqlite' | 'server-json' | 'local-storage' | 'memory-fallback';

export const DEMO_SEED_RECORDS: ScoreEntry[] = [
  {
    id: 'demo-cyber-kamil',
    nickname: 'CYBER_KAMIL',
    mode: 'HACKER',
    duration: 30,
    wpm: 94,
    accuracy: 98.4,
    errors: 4,
    correctChars: 235,
    totalChars: 239,
    score: 9102,
    createdAt: '2026-10-13T08:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-root-ania',
    nickname: 'ROOT_ANIA',
    mode: 'CODE',
    duration: 30,
    wpm: 82,
    accuracy: 97.2,
    errors: 6,
    correctChars: 205,
    totalChars: 211,
    score: 7747,
    createdAt: '2026-10-13T08:22:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-neo-bartek',
    nickname: 'NEO_BARTEK',
    mode: 'EASY',
    duration: 30,
    wpm: 88,
    accuracy: 96.5,
    errors: 8,
    correctChars: 220,
    totalChars: 228,
    score: 8195,
    createdAt: '2026-10-13T08:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-zero-marta',
    nickname: 'ZERO_MARTA',
    mode: 'HACKER',
    duration: 60,
    wpm: 79,
    accuracy: 99.1,
    errors: 4,
    correctChars: 395,
    totalChars: 399,
    score: 7758,
    createdAt: '2026-10-13T08:40:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-byte-tomek',
    nickname: 'BYTE_TOMEK',
    mode: 'EASY',
    duration: 60,
    wpm: 71,
    accuracy: 95.0,
    errors: 18,
    correctChars: 355,
    totalChars: 373,
    score: 6408,
    createdAt: '2026-10-13T08:45:00.000Z',
    isDemo: true,
  },
];

export interface LeaderboardStorageService {
  getScores(includeDemo?: boolean): ScoreEntry[];
  syncFromServer(includeDemo?: boolean): Promise<{
    scores: ScoreEntry[];
    backend: StorageBackendStatus;
  }>;
  saveScore(entry: ScoreEntry): Promise<{
    saved: boolean;
    duplicate: boolean;
    entry: ScoreEntry;
    backend: StorageBackendStatus;
    warning?: string;
  }>;
  seedDemoScores(): Promise<ScoreEntry[]>;
  clearDemoScores(): Promise<ScoreEntry[]>;
  resetAllScores(): Promise<ScoreEntry[]>;
  getBackendStatus(): StorageBackendStatus;
}

class HybridLeaderboardStorage implements LeaderboardStorageService {
  private memoryStore: ScoreEntry[] = [];
  private backendStatus: StorageBackendStatus = 'local-storage';
  private enableNetworkSync: boolean;

  constructor(enableNetworkSync = true) {
    this.enableNetworkSync = enableNetworkSync;
  }

  private readLocal(): ScoreEntry[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.backendStatus = 'memory-fallback';
        return [...this.memoryStore];
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      // Filter out any corrupted or invalid entries
      const validEntries = parsed.filter(isValidScoreEntry).map((e) => ({
        ...e,
        nickname: validateNickname(e.nickname).sanitized,
        isDemo: Boolean(e.isDemo),
      }));
      this.memoryStore = validEntries;
      return validEntries;
    } catch {
      this.backendStatus = 'memory-fallback';
      return [...this.memoryStore];
    }
  }

  private writeLocal(entries: ScoreEntry[]): void {
    const deduplicated = this.deduplicateAndValidate(entries);
    this.memoryStore = deduplicated;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
        if (this.backendStatus === 'memory-fallback') {
          this.backendStatus = 'local-storage';
        }
      } else {
        this.backendStatus = 'memory-fallback';
      }
    } catch {
      this.backendStatus = 'memory-fallback';
    }
  }

  private deduplicateAndValidate(entries: ScoreEntry[]): ScoreEntry[] {
    const byId = new Map<string, ScoreEntry>();
    for (const item of entries) {
      if (!isValidScoreEntry(item)) continue;
      const sanitizedNick = validateNickname(item.nickname).sanitized;
      if (!byId.has(item.id)) {
        byId.set(item.id, {
          ...item,
          nickname: sanitizedNick,
          wpm: Math.round(item.wpm),
          accuracy: Math.round(item.accuracy * 10) / 10,
          errors: Math.round(item.errors),
          correctChars: Math.round(item.correctChars),
          totalChars: Math.round(item.totalChars),
          score: Math.round(item.score),
          isDemo: Boolean(item.isDemo),
        });
      }
    }
    return Array.from(byId.values()).sort(compareScores);
  }

  getBackendStatus(): StorageBackendStatus {
    return this.backendStatus;
  }

  /**
   * Synchronous read of persisted scores (filters out demo scores by default).
   */
  getScores(includeDemo = false): ScoreEntry[] {
    const all = this.readLocal();
    const filtered = includeDemo ? all : all.filter((e) => !e.isDemo);
    return filtered.sort(compareScores);
  }

  /**
   * Synchronizes local storage with the backend SQLite/JSON API if reachable.
   */
  async syncFromServer(includeDemo = false): Promise<{
    scores: ScoreEntry[];
    backend: StorageBackendStatus;
  }> {
    const localAll = this.readLocal();

    if (!this.enableNetworkSync || typeof fetch === 'undefined') {
      return {
        scores: this.getScores(includeDemo),
        backend: this.backendStatus,
      };
    }

    try {
      const response = await fetch('/api/scores?includeDemo=true', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.scores)) {
          this.backendStatus = data.engine === 'sqlite' ? 'server-sqlite' : 'server-json';
          const merged = this.deduplicateAndValidate([...data.scores, ...localAll]);
          this.writeLocal(merged);

          // Push any local-only real scores up to the server so nothing is ever lost
          const serverIds = new Set(data.scores.map((s: ScoreEntry) => s.id));
          for (const entry of localAll) {
            if (!serverIds.has(entry.id) && !entry.isDemo) {
              fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
              }).catch(() => {});
            }
          }
        }
      }
    } catch {
      if (this.backendStatus.startsWith('server')) {
        this.backendStatus = 'local-storage';
      }
    }

    return {
      scores: this.getScores(includeDemo),
      backend: this.backendStatus,
    };
  }

  /**
   * Saves a validated score entry, preventing duplicate submissions for the same session ID.
   */
  async saveScore(entry: ScoreEntry): Promise<{
    saved: boolean;
    duplicate: boolean;
    entry: ScoreEntry;
    backend: StorageBackendStatus;
    warning?: string;
  }> {
    if (!isValidScoreEntry(entry)) {
      throw new Error('Nieprawidłowe dane wyniku — zapis został odrzucony.');
    }

    const sanitizedEntry: ScoreEntry = {
      ...entry,
      nickname: validateNickname(entry.nickname).sanitized,
      wpm: Math.round(entry.wpm),
      accuracy: Math.round(entry.accuracy * 10) / 10,
      errors: Math.round(entry.errors),
      correctChars: Math.round(entry.correctChars),
      totalChars: Math.round(entry.totalChars),
      score: Math.round(entry.score),
      isDemo: Boolean(entry.isDemo),
    };

    const current = this.readLocal();
    const alreadyExists = current.some((existing) => existing.id === sanitizedEntry.id);

    if (alreadyExists) {
      return {
        saved: false,
        duplicate: true,
        entry: sanitizedEntry,
        backend: this.backendStatus,
      };
    }

    const updated = [...current, sanitizedEntry];
    this.writeLocal(updated);

    let warning: string | undefined;

    if (this.enableNetworkSync && typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedEntry),
        });
        if (res.ok) {
          const body = await res.json();
          this.backendStatus = body.engine === 'sqlite' ? 'server-sqlite' : 'server-json';
        } else {
          warning = 'Zapisano lokalnie w przeglądarce (serwer API niedostępny).';
        }
      } catch {
        warning = 'Zapisano lokalnie w przeglądarce (tryb offline).';
      }
    }

    return {
      saved: true,
      duplicate: false,
      entry: sanitizedEntry,
      backend: this.backendStatus,
      warning,
    };
  }

  async seedDemoScores(): Promise<ScoreEntry[]> {
    const current = this.readLocal();
    const merged = this.deduplicateAndValidate([...current, ...DEMO_SEED_RECORDS]);
    this.writeLocal(merged);

    if (this.enableNetworkSync && typeof fetch !== 'undefined') {
      try {
        await fetch('/api/scores/demo', { method: 'POST' });
      } catch {
        // Local storage already updated
      }
    }

    return this.getScores(true);
  }

  async clearDemoScores(): Promise<ScoreEntry[]> {
    const current = this.readLocal().filter((e) => !e.isDemo);
    this.writeLocal(current);

    if (this.enableNetworkSync && typeof fetch !== 'undefined') {
      try {
        await fetch('/api/scores/demo', {
          method: 'DELETE',
          headers: { 'x-organizer-action': 'confirm-clear-demo' },
        });
      } catch {
        // Local storage already updated
      }
    }

    return this.getScores(false);
  }

  async resetAllScores(): Promise<ScoreEntry[]> {
    this.writeLocal([]);

    if (this.enableNetworkSync && typeof fetch !== 'undefined') {
      try {
        await fetch('/api/scores/reset', {
          method: 'DELETE',
          headers: { 'x-organizer-action': 'confirm-reset-all' },
        });
      } catch {
        // Local storage already cleared
      }
    }

    return [];
  }
}

export function createLeaderboardStorage(enableNetworkSync = true): LeaderboardStorageService {
  return new HybridLeaderboardStorage(enableNetworkSync);
}

export const leaderboardStorage = createLeaderboardStorage(true);
