import React from 'react';
import { MODE_METADATA } from '../data/passages';
import { GameSessionResult } from '../types/game';

interface ResultsScreenProps {
  result: GameSessionResult;
  saveWarning?: string;
  onPlayAgainSamePlayer: () => void;
  onNextPlayer: () => void;
  onViewLeaderboard: () => void;
  onReturnHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  saveWarning,
  onPlayAgainSamePlayer,
  onNextPlayer,
  onViewLeaderboard,
  onReturnHome,
}) => {
  const modeMeta = MODE_METADATA[result.mode];
  const isRankOne = result.rankPosition === 1;
  const isTopThree = result.rankPosition !== null && result.rankPosition <= 3;

  const scoreDiffFromLeader =
    result.topScoreInMode !== null ? result.topScoreInMode - result.score : 0;

  return (
    <section className="results-wrapper" aria-label="Podsumowanie wyniku gry">
      <div className="terminal-panel accent-green">
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot green" />
            <span className="panel-dot cyan" />
            <span style={{ marginLeft: '0.4rem' }}>TERMINAL://SESSION_COMPLETE</span>
          </div>
          <span>RAPORT KOŃCOWY // {result.nickname}</span>
        </div>

        {/* Hero Score Banner */}
        <div className="results-hero">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap',
              marginBottom: '0.85rem',
            }}
          >
            {isRankOne && (
              <span className="status-pill online" style={{ fontSize: '0.8rem' }}>
                ★ NOWY LIDER RANKINGU (#1)!
              </span>
            )}
            {!isRankOne && isTopThree && (
              <span className="status-pill cyan" style={{ fontSize: '0.8rem' }}>
                ★ AWANS DO TOP 3 PODIUM (#{result.rankPosition})!
              </span>
            )}
            {result.isPersonalBest && (
              <span className="status-pill amber" style={{ fontSize: '0.8rem' }}>
                ▲ NOWY REKORD OSOBISTY GRACZA {result.nickname}!
              </span>
            )}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            WYNIK KOŃCOWY ({modeMeta.label} &bull; {result.duration}s)
          </div>

          <div className="final-score-number" data-testid="result-final-score">
            {result.score} <span style={{ fontSize: '1.6rem' }}>PKT</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Wzór punktacji: WPM ({result.wpm}) &times; Celność&sup2; ({result.accuracy.toFixed(1)}%) &times; 100
          </div>
        </div>

        {/* Core 4 Metrics Grid */}
        <div className="results-metrics-grid">
          <div className="stat-tile">
            <div className="stat-tile-label">PRĘDKOŚĆ (WPM)</div>
            <div className="stat-tile-value cyan" data-testid="result-wpm">
              {result.wpm} WPM
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              Słów na minutę (5 zn. = 1 słowo)
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile-label">CELNOŚĆ (ACCURACY)</div>
            <div className="stat-tile-value green" data-testid="result-accuracy">
              {result.accuracy.toFixed(1)}%
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              Poprawne: {result.correctChars}/{result.totalChars}
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile-label">LICZBA BŁĘDÓW</div>
            <div
              className="stat-tile-value"
              data-testid="result-errors"
              style={{
                color: result.errors === 0 ? 'var(--neon-green)' : 'var(--neon-red)',
              }}
            >
              {result.errors}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              {result.errors === 0 ? 'Perfekcyjna bezbłędność!' : 'Niepoprawione znaki'}
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile-label">WPISANE ZNAKI</div>
            <div className="stat-tile-value amber" data-testid="result-chars">
              {result.totalChars}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              Ukończone teksty: {result.passagesCompleted}
            </div>
          </div>
        </div>

        {/* Ranking Position & Comparison Banner */}
        <div
          style={{
            margin: '0 2.25rem 1.75rem',
            padding: '1.1rem 1.35rem',
            background: 'var(--bg-panel-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.86rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>POZYCJA W RANKINGU: </span>
            <strong style={{ color: 'var(--neon-green)', fontSize: '1.05rem' }}>
              {result.rankPosition !== null
                ? `#${result.rankPosition} z ${result.totalQualifyingPlayers}`
                : 'Zapisano'}
            </strong>
          </div>

          <div>
            {isRankOne ? (
              <span style={{ color: 'var(--neon-green)' }}>
                Ustanowiłeś najwyższy wynik w tej kategorii ({result.score} PKT)!
              </span>
            ) : result.topScoreInMode !== null ? (
              <span style={{ color: 'var(--text-secondary)' }}>
                Najlepszy wynik (#1):{' '}
                <strong style={{ color: 'var(--neon-cyan)' }}>{result.topScoreInMode} PKT</strong>{' '}
                (brakuje {Math.max(1, scoreDiffFromLeader)} PKT)
              </span>
            ) : null}
          </div>
        </div>

        {saveWarning && (
          <div
            style={{
              margin: '0 2.25rem 1.25rem',
              padding: '0.65rem 1rem',
              border: '1px solid var(--border-amber)',
              color: 'var(--neon-amber)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
            }}
          >
            INFO: {saveWarning}
          </div>
        )}

        {/* Action Buttons Bar */}
        <div
          style={{
            padding: '1.35rem 2.25rem',
            background: 'var(--bg-panel-elevated)',
            borderTop: '1px solid var(--border-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onPlayAgainSamePlayer}
              autoFocus
            >
              ZAGRAJ PONOWNIE ({result.nickname})
            </button>

            <button
              type="button"
              className="btn btn-cyan"
              onClick={onNextPlayer}
              title="Wyczyść nick i przygotuj ekran dla kolejnej osoby przy stoisku"
            >
              NASTĘPNY GRACZ
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={onViewLeaderboard}>
              LEADERBOARD
            </button>

            <button type="button" className="btn" onClick={onReturnHome}>
              MENU
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
