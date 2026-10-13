import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MODE_METADATA, selectNextPassage } from '../data/passages';
import { GameDuration, GameMode, LiveGameMetrics, PassageItem } from '../types/game';
import { computeSessionMetrics, evaluatePassageInput } from '../utils/metrics';

interface CompletedPassageStats {
  correctChars: number;
  errors: number;
  totalChars: number;
}

export interface FinishedGamePayload extends LiveGameMetrics {
  sessionId: string;
  nickname: string;
  mode: GameMode;
  duration: GameDuration;
  passagesCompleted: number;
}

interface GameScreenProps {
  sessionId: string;
  nickname: string;
  mode: GameMode;
  duration: GameDuration;
  sessionSeed?: number;
  onGameComplete: (payload: FinishedGamePayload) => void;
  onAbortToSetup: () => void;
  onRunningChange?: (running: boolean) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  sessionId,
  nickname,
  mode,
  duration,
  sessionSeed = 0,
  onGameComplete,
  onAbortToSetup,
  onRunningChange,
}) => {
  const initialPassage = useRef<PassageItem>(selectNextPassage(mode, [], sessionSeed)).current;

  const [currentPassage, setCurrentPassage] = useState<PassageItem>(initialPassage);
  const [usedIds, setUsedIds] = useState<string[]>([initialPassage.id]);
  const [typedInput, setTypedInput] = useState<string>('');
  const [completedPassages, setCompletedPassages] = useState<CompletedPassageStats[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // Refs for synchronous access inside timer callback & single-completion lock
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFinishedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const typedInputRef = useRef<string>('');
  const currentPassageRef = useRef<PassageItem>(initialPassage);
  const completedPassagesRef = useRef<CompletedPassageStats[]>([]);
  const usedIdsRef = useRef<string[]>([initialPassage.id]);

  const totalDurationMs = duration * 1000;

  const clearGameTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const finalizeGame = useCallback(() => {
    if (hasFinishedRef.current || !isMountedRef.current) {
      return;
    }
    hasFinishedRef.current = true;
    clearGameTimer();
    setIsRunning(false);
    onRunningChange?.(false);

    const finalMetrics = computeSessionMetrics(
      completedPassagesRef.current,
      typedInputRef.current,
      currentPassageRef.current.text,
      totalDurationMs,
      duration
    );

    onGameComplete({
      ...finalMetrics,
      sessionId,
      nickname,
      mode,
      duration,
      passagesCompleted: completedPassagesRef.current.length,
    });
  }, [clearGameTimer, duration, mode, nickname, onGameComplete, onRunningChange, sessionId, totalDurationMs]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    inputRef.current?.focus();

    return () => {
      isMountedRef.current = false;
      clearGameTimer();
      onRunningChange?.(false);
    };
  }, [clearGameTimer, onRunningChange]);

  // Prevent accidental browser reload / back shortcuts while typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'w')) {
        e.preventDefault();
      }
      if (e.key === 'F5' || (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const startTimerIfNeeded = useCallback(() => {
    if (startTimeRef.current !== null || hasFinishedRef.current) {
      return;
    }
    const now = Date.now();
    startTimeRef.current = now;
    setIsRunning(true);
    onRunningChange?.(true);

    timerIdRef.current = setInterval(() => {
      if (hasFinishedRef.current || !isMountedRef.current || startTimeRef.current === null) {
        return;
      }
      const currentElapsed = Date.now() - startTimeRef.current;
      if (currentElapsed >= totalDurationMs) {
        setElapsedMs(totalDurationMs);
        finalizeGame();
      } else {
        setElapsedMs(currentElapsed);
      }
    }, 50);
  }, [finalizeGame, onRunningChange, totalDurationMs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasFinishedRef.current) {
      return;
    }

    const rawValue = e.target.value;
    const targetText = currentPassageRef.current.text;

    // Start the timer strictly on the first character typed
    if (startTimeRef.current === null && rawValue.length > 0) {
      startTimerIfNeeded();
    }

    // Prevent typing beyond the end of the current passage
    const clampedValue = rawValue.slice(0, targetText.length);
    const evaluation = evaluatePassageInput(clampedValue, targetText);

    // Check if the player just completed the entire passage
    if (evaluation.isComplete) {
      const completedEntry: CompletedPassageStats = {
        correctChars: evaluation.correctChars,
        errors: evaluation.errors,
        totalChars: evaluation.totalChars,
      };
      const updatedCompleted = [...completedPassagesRef.current, completedEntry];
      completedPassagesRef.current = updatedCompleted;
      setCompletedPassages(updatedCompleted);

      // Immediately load next passage without resetting timer
      const nextPassage = selectNextPassage(mode, usedIdsRef.current, sessionSeed);
      const nextUsedIds = [...usedIdsRef.current, nextPassage.id];
      usedIdsRef.current = nextUsedIds;
      currentPassageRef.current = nextPassage;
      typedInputRef.current = '';

      setUsedIds(nextUsedIds);
      setCurrentPassage(nextPassage);
      setTypedInput('');
      return;
    }

    typedInputRef.current = clampedValue;
    setTypedInput(clampedValue);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Prevent Enter from submitting any parent form or losing focus
      e.preventDefault();
    }
  };

  const focusTypingInput = () => {
    if (!hasFinishedRef.current) {
      inputRef.current?.focus();
    }
  };

  const liveMetrics = computeSessionMetrics(
    completedPassages,
    typedInput,
    currentPassage.text,
    elapsedMs,
    duration
  );

  const activeEvaluation = evaluatePassageInput(typedInput, currentPassage.text);
  const remainingSeconds = Math.max(0, liveMetrics.remainingMs / 1000);
  const progressPercent = Math.max(0, Math.min(100, (liveMetrics.remainingMs / totalDurationMs) * 100));

  const isWarningTime = remainingSeconds <= 10 && remainingSeconds > 5;
  const isDangerTime = remainingSeconds <= 5;

  const timerBoxClass = isDangerTime
    ? 'timer-danger'
    : isWarningTime
      ? 'timer-warning'
      : 'timer-box';

  const progressFillClass = isDangerTime
    ? 'danger'
    : isWarningTime
      ? 'warning'
      : '';

  const modeMeta = MODE_METADATA[mode];

  return (
    <section
      className="game-arena"
      aria-label="Aktywna rozgrywka KEYBOARD WARRIOR"
      onClick={focusTypingInput}
    >
      {/* Top Session Bar: Player, Mode, Passages counter, and Abort control */}
      <div
        className="terminal-panel"
        style={{
          padding: '0.65rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
          }}
        >
          <span>
            GRACZ: <strong style={{ color: 'var(--neon-green)' }}>{nickname}</strong>
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span>
            TRYB: <strong style={{ color: 'var(--neon-cyan)' }}>{modeMeta.label}</strong> ({duration}s)
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span>
            UKOŃCZONE FRAGMENTY: <strong>{completedPassages.length}</strong> (#{usedIds.length})
          </span>
        </div>

        <button
          type="button"
          className="btn btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            clearGameTimer();
            onRunningChange?.(false);
            onAbortToSetup();
          }}
        >
          ZMIEŃ TRYB / RESET
        </button>
      </div>

      {/* Live Metrics HUD */}
      <div className="hud-bar" role="region" aria-label="Statystyki na żywo">
        <div className={`hud-box ${timerBoxClass}`}>
          <span className="hud-label">POZOSTAŁY CZAS</span>
          <span
            className="hud-value"
            data-testid="hud-timer"
            style={{
              color: isDangerTime
                ? 'var(--neon-red)'
                : isWarningTime
                  ? 'var(--neon-amber)'
                  : 'var(--neon-green)',
            }}
          >
            {remainingSeconds.toFixed(1)}s
          </span>
        </div>

        <div className="hud-box">
          <span className="hud-label">PRĘDKOŚĆ (WPM)</span>
          <span className="hud-value" data-testid="hud-wpm" style={{ color: 'var(--neon-cyan)' }}>
            {liveMetrics.wpm}
          </span>
        </div>

        <div className="hud-box">
          <span className="hud-label">CELNOŚĆ (ACCURACY)</span>
          <span className="hud-value" data-testid="hud-accuracy">
            {liveMetrics.accuracy.toFixed(1)}%
          </span>
        </div>

        <div className="hud-box">
          <span className="hud-label">BŁĘDY (ERRORS)</span>
          <span
            className="hud-value"
            data-testid="hud-errors"
            style={{
              color: liveMetrics.errors > 0 ? 'var(--neon-red)' : 'var(--text-primary)',
            }}
          >
            {liveMetrics.errors}
          </span>
        </div>

        <div className="hud-box">
          <span className="hud-label">WYNIK NA ŻYWO</span>
          <span className="hud-value" data-testid="hud-score" style={{ color: 'var(--neon-green)' }}>
            {liveMetrics.score}
          </span>
        </div>
      </div>

      {/* Remaining Time Progress Bar */}
      <div
        className="time-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.ceil(remainingSeconds)}
        aria-label="Pasek pozostałego czasu"
      >
        <div
          className={`time-progress-fill ${progressFillClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Typing Terminal */}
      <div className="terminal-panel accent-green">
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot green" />
            <span className="panel-dot cyan" />
            <span style={{ marginLeft: '0.4rem' }}>
              PASSAGE_ID: {currentPassage.id.toUpperCase()} ({typedInput.length}/{currentPassage.text.length} ZNAKÓW)
            </span>
          </div>
          <span>
            {isRunning
              ? 'LICZNIK AKTYWNY — PISZ DALEJ!'
              : 'WPISZ PIERWSZY ZNAK, ABY URUCHOMIĆ CZAS'}
          </span>
        </div>

        {/* Target Passage Display */}
        <div
          className="passage-viewport"
          data-testid="passage-display"
          aria-label="Tekst do przepisania"
        >
          <p className="passage-text">
            {Array.from(currentPassage.text).map((char, index) => {
              const state = activeEvaluation.charStates[index];
              const isCursor = index === typedInput.length;
              const classNames = ['char-cell', state, isCursor ? 'active-cursor' : '']
                .filter(Boolean)
                .join(' ');

              return (
                <span key={index} className={classNames}>
                  {char}
                </span>
              );
            })}
          </p>
        </div>

        {/* Accessible Typing Input directly below passage */}
        <div className="typing-input-zone">
          <label htmlFor="active-typing-input" className="field-label">
            <span>
              {isRunning
                ? '&gt; WPROWADZANIE AKTYWNE (BACKSPACE POPRAWIA BŁĘDY)'
                : '&gt; ZACZNIJ PISAĆ TUTAJ — CZAS RUSZY AUTOMATYCZNIE'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{modeMeta.caseRuleNote}</span>
          </label>

          <input
            ref={inputRef}
            id="active-typing-input"
            data-testid="typing-input"
            type="text"
            className={`game-typing-input ${activeEvaluation.errors > 0 ? 'has-error' : ''}`}
            value={typedInput}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={() => {
              // Keep input focused during active game unless unmounted
              setTimeout(() => {
                if (
                  isMountedRef.current &&
                  !hasFinishedRef.current &&
                  document.activeElement?.tagName !== 'BUTTON'
                ) {
                  inputRef.current?.focus();
                }
              }, 15);
            }}
            placeholder="Rozpocznij pisanie wyświetlanego wyżej tekstu..."
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Pole wpisywania tekstu"
          />
        </div>
      </div>
    </section>
  );
};
