export type GameMode = 'EASY' | 'HACKER' | 'CODE';

export type GameDuration = 30 | 60;

export type AppScreen = 'HOME' | 'SETUP' | 'GAME' | 'RESULTS' | 'LEADERBOARD';

export interface ModeMetadata {
  id: GameMode;
  label: string;
  polishTitle: string;
  badge: string;
  description: string;
  instructions: string;
  difficulty: string;
  caseRuleNote: string;
  accentColor: 'green' | 'cyan' | 'amber';
}

export interface PassageItem {
  id: string;
  mode: GameMode;
  text: string;
}

export interface ScoreEntry {
  /** Unique session identifier to prevent duplicate submissions */
  id: string;
  nickname: string;
  mode: GameMode;
  duration: GameDuration;
  wpm: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  totalChars: number;
  score: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface LiveGameMetrics {
  wpm: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  totalChars: number;
  score: number;
  elapsedMs: number;
  remainingMs: number;
}

export interface GameSessionResult extends LiveGameMetrics {
  id: string;
  nickname: string;
  mode: GameMode;
  duration: GameDuration;
  passagesCompleted: number;
  createdAt: string;
  isPersonalBest: boolean;
  rankPosition: number | null;
  totalQualifyingPlayers: number;
  topScoreInMode: number | null;
}

export interface LeaderboardFilters {
  mode: GameMode | 'ALL';
  duration: GameDuration | 'ALL';
  includeDemo: boolean;
}
