import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FinishedGamePayload, GameScreen } from './components/GameScreen';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { OrganizerModal } from './components/OrganizerModal';
import { ResultsScreen } from './components/ResultsScreen';
import { SetupScreen } from './components/SetupScreen';
import {
  leaderboardStorage,
  LeaderboardStorageService,
  StorageBackendStatus,
} from './services/storage';
import {
  AppScreen,
  GameDuration,
  GameMode,
  GameSessionResult,
  ScoreEntry,
} from './types/game';
import { filterAndSortScores } from './utils/metrics';

interface AppProps {
  storage?: LeaderboardStorageService;
}

export const App: React.FC<AppProps> = ({ storage = leaderboardStorage }) => {
  const [screen, setScreen] = useState<AppScreen>('HOME');
  const [activeNickname, setActiveNickname] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('EASY');
  const [selectedDuration, setSelectedDuration] = useState<GameDuration>(30);

  const [sessionId, setSessionId] = useState<string>('');
  const [sessionSeed, setSessionSeed] = useState<number>(0);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);

  const [lastResult, setLastResult] = useState<GameSessionResult | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | undefined>(undefined);

  const [includeDemo, setIncludeDemo] = useState<boolean>(false);
  const [allScores, setAllScores] = useState<ScoreEntry[]>(() => storage.getScores(true));
  const [backendStatus, setBackendStatus] = useState<StorageBackendStatus>(() =>
    storage.getBackendStatus()
  );

  const [kioskMode, setKioskMode] = useState<boolean>(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState<boolean>(false);

  const runCounterRef = useRef<number>(0);
  const submittedIdsRef = useRef<Set<string>>(new Set());

  const refreshScores = useCallback(async () => {
    const local = storage.getScores(true);
    setAllScores(local);
    const synced = await storage.syncFromServer(true);
    setAllScores(synced.scores);
    setBackendStatus(synced.backend);
  }, [storage]);

  useEffect(() => {
    refreshScores();
  }, [refreshScores]);

  // Keyboard shortcut Ctrl+Shift+O for Organizer Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        if (!isGameRunning) {
          setIsOrganizerOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape' && isOrganizerOpen) {
        setIsOrganizerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, isOrganizerOpen]);

  const visibleScores = filterAndSortScores(allScores, {
    includeDemo,
  });

  // Resets transient state and goes to Home screen
  const handleNavigateHome = () => {
    setIsGameRunning(false);
    setActiveNickname('');
    setSaveWarning(undefined);
    setScreen('HOME');
  };

  // Starts fresh player setup (clears previous player's nickname)
  const handleStartNewPlayer = () => {
    setIsGameRunning(false);
    setActiveNickname('');
    setSaveWarning(undefined);
    setScreen('SETUP');
  };

  // Launches active game session
  const handleLaunchGame = (nickname: string, mode: GameMode, duration: GameDuration) => {
    const currentRunIndex = runCounterRef.current++;
    const randomPart = Math.random().toString(36).slice(2, 8);
    const newSessionId = `session-${Date.now()}-${currentRunIndex}-${randomPart}`;
    setActiveNickname(nickname);
    setSelectedMode(mode);
    setSelectedDuration(duration);
    setSessionId(newSessionId);
    setSessionSeed(currentRunIndex);
    setSaveWarning(undefined);
    setScreen('GAME');
  };

  // Replays immediately with the same nickname & settings
  const handlePlayAgainSamePlayer = () => {
    if (!activeNickname) {
      handleStartNewPlayer();
      return;
    }
    handleLaunchGame(activeNickname, selectedMode, selectedDuration);
  };

  // Handles completion of a timed game session
  const handleGameComplete = useCallback(
    async (payload: FinishedGamePayload) => {
      // Guard against duplicate submissions for the same sessionId
      if (submittedIdsRef.current.has(payload.sessionId)) {
        return;
      }
      submittedIdsRef.current.add(payload.sessionId);
      setIsGameRunning(false);

      const createdAt = new Date().toISOString();

      // Check previous personal best for this nickname (case-insensitive match)
      const existingScores = storage.getScores(includeDemo);
      const previousPlayerBest = existingScores
        .filter((s) => s.nickname.toLowerCase() === payload.nickname.toLowerCase())
        .reduce((max, s) => (s.score > max ? s.score : max), -1);

      const isPersonalBest = payload.score > 0 && payload.score > previousPlayerBest;

      const newEntry: ScoreEntry = {
        id: payload.sessionId,
        nickname: payload.nickname,
        mode: payload.mode,
        duration: payload.duration,
        wpm: payload.wpm,
        accuracy: payload.accuracy,
        errors: payload.errors,
        correctChars: payload.correctChars,
        totalChars: payload.totalChars,
        score: payload.score,
        createdAt,
        isDemo: false,
      };

      const saveOutcome = await storage.saveScore(newEntry);
      setSaveWarning(saveOutcome.warning);
      setBackendStatus(saveOutcome.backend);

      const updatedAll = storage.getScores(true);
      setAllScores(updatedAll);

      const rankedList = filterAndSortScores(updatedAll, { includeDemo });
      const rankIndex = rankedList.findIndex((s) => s.id === newEntry.id);
      const rankPosition = rankIndex !== -1 ? rankIndex + 1 : null;
      const topScoreInMode = rankedList.length > 0 ? rankedList[0].score : newEntry.score;

      const sessionResult: GameSessionResult = {
        id: newEntry.id,
        nickname: newEntry.nickname,
        mode: newEntry.mode,
        duration: newEntry.duration,
        wpm: newEntry.wpm,
        accuracy: newEntry.accuracy,
        errors: newEntry.errors,
        correctChars: newEntry.correctChars,
        totalChars: newEntry.totalChars,
        score: newEntry.score,
        elapsedMs: payload.elapsedMs,
        remainingMs: 0,
        passagesCompleted: payload.passagesCompleted,
        createdAt,
        isPersonalBest,
        rankPosition,
        totalQualifyingPlayers: rankedList.length,
        topScoreInMode,
      };

      setLastResult(sessionResult);
      setScreen('RESULTS');
    },
    [includeDemo, storage]
  );

  const handleToggleKiosk = () => {
    const nextKiosk = !kioskMode;
    setKioskMode(nextKiosk);
    try {
      if (nextKiosk && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!nextKiosk && document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore fullscreen API restrictions in headless/iframe environments
    }
  };

  const totalRealCount = allScores.filter((s) => !s.isDemo).length;
  const totalDemoCount = allScores.filter((s) => s.isDemo).length;

  return (
    <div className="app-shell">
      <Header
        currentScreen={screen}
        activeNickname={activeNickname}
        isGameRunning={isGameRunning}
        kioskMode={kioskMode}
        backendStatus={backendStatus}
        includeDemo={includeDemo}
        onNavigateHome={handleNavigateHome}
        onNavigateLeaderboard={() => setScreen('LEADERBOARD')}
        onStartNewPlayer={handleStartNewPlayer}
        onToggleKiosk={handleToggleKiosk}
      />

      <main className="main-stage">
        {screen === 'HOME' && (
          <HomeScreen
            scores={visibleScores}
            onStartChallenge={handleStartNewPlayer}
            onViewLeaderboard={() => setScreen('LEADERBOARD')}
          />
        )}

        {screen === 'SETUP' && (
          <SetupScreen
            initialNickname={activeNickname}
            initialMode={selectedMode}
            initialDuration={selectedDuration}
            onStartGame={handleLaunchGame}
            onBackToHome={handleNavigateHome}
          />
        )}

        {screen === 'GAME' && (
          <GameScreen
            key={sessionId}
            sessionId={sessionId}
            nickname={activeNickname}
            mode={selectedMode}
            duration={selectedDuration}
            sessionSeed={sessionSeed}
            onGameComplete={handleGameComplete}
            onAbortToSetup={() => {
              setIsGameRunning(false);
              setScreen('SETUP');
            }}
            onRunningChange={setIsGameRunning}
          />
        )}

        {screen === 'RESULTS' && lastResult && (
          <ResultsScreen
            result={lastResult}
            saveWarning={saveWarning}
            onPlayAgainSamePlayer={handlePlayAgainSamePlayer}
            onNextPlayer={handleStartNewPlayer}
            onViewLeaderboard={() => setScreen('LEADERBOARD')}
            onReturnHome={handleNavigateHome}
          />
        )}

        {screen === 'LEADERBOARD' && (
          <LeaderboardScreen
            scores={allScores}
            latestScoreId={lastResult?.id || null}
            activeNickname={activeNickname}
            includeDemo={includeDemo}
            onStartChallenge={() => {
              if (activeNickname) {
                setScreen('SETUP');
              } else {
                handleStartNewPlayer();
              }
            }}
            onReturnHome={handleNavigateHome}
          />
        )}
      </main>

      {!kioskMode && (
        <footer className="app-footer">
          <div className="app-footer-inner">
            <div>
              <span>KEYBOARD WARRIOR v1.0</span> &bull;{' '}
              <span>KOŁO NAUKOWE INFORMATYKÓW (KNI)</span> &bull;{' '}
              <span>&ldquo;Mniej klikania. Więcej kodowania.&rdquo;</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!isGameRunning && (
                <button
                  type="button"
                  onClick={() => setIsOrganizerOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  title="Narzędzia organizatora wydarzenia (Ctrl+Shift+O)"
                >
                  [PANEL ORGANIZATORA // CTRL+SHIFT+O]
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      <OrganizerModal
        isOpen={isOrganizerOpen}
        includeDemo={includeDemo}
        totalRealCount={totalRealCount}
        totalDemoCount={totalDemoCount}
        backendStatus={backendStatus}
        onClose={() => setIsOrganizerOpen(false)}
        onToggleIncludeDemo={setIncludeDemo}
        onSeedDemo={async () => {
          const updated = await storage.seedDemoScores();
          setAllScores(updated);
        }}
        onClearDemo={async () => {
          await storage.clearDemoScores();
          setAllScores(storage.getScores(true));
        }}
        onResetAllScores={async () => {
          await storage.resetAllScores();
          setAllScores([]);
          setLastResult(null);
        }}
      />
    </div>
  );
};

export default App;
