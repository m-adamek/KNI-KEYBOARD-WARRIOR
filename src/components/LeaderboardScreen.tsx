import React, { useState } from 'react';
import { MODE_METADATA } from '../data/passages';
import { GameDuration, GameMode, ScoreEntry } from '../types/game';
import { filterAndSortScores } from '../utils/metrics';

interface LeaderboardScreenProps {
  scores: ScoreEntry[];
  latestScoreId: string | null;
  activeNickname: string;
  includeDemo: boolean;
  onStartChallenge: () => void;
  onReturnHome: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  scores,
  latestScoreId,
  activeNickname,
  includeDemo,
  onStartChallenge,
  onReturnHome,
}) => {
  const [modeFilter, setModeFilter] = useState<GameMode | 'ALL'>('ALL');
  const [durationFilter, setDurationFilter] = useState<GameDuration | 'ALL'>('ALL');

  const filteredScores = filterAndSortScores(scores, {
    mode: modeFilter,
    duration: durationFilter,
    includeDemo,
  });

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <section
      style={{ maxWidth: '1180px', width: '100%', margin: '0 auto' }}
      aria-label="Tabela wyników KEYBOARD WARRIOR"
    >
      <div className="terminal-panel accent-cyan">
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot cyan" />
            <span className="panel-dot green" />
            <span style={{ marginLeft: '0.4rem' }}>TERMINAL://PUBLIC_LEADERBOARD</span>
          </div>
          <span>RANKING NA ŻYWO ({filteredScores.length} WYNIKÓW)</span>
        </div>

        {/* Top Header & Filter Controls */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid var(--border-dim)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.85rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                PUBLIC LEADERBOARD
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Sortowanie: Wynik główny (PKT) &rarr; Celność (%) &rarr; Prędkość (WPM)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={onReturnHome}>
                &larr; MENU GŁÓWNE
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onStartChallenge}
              >
                {activeNickname ? `ZAGRAJ (${activeNickname})` : 'START CHALLENGE'}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              paddingTop: '0.35rem',
            }}
          >
            {/* Mode Filter */}
            <div
              role="group"
              aria-label="Filtruj według trybu gry"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  marginRight: '0.25rem',
                }}
              >
                TRYB:
              </span>
              {(['ALL', 'EASY', 'HACKER', 'CODE'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`btn btn-sm ${modeFilter === m ? 'btn-cyan' : ''}`}
                  onClick={() => setModeFilter(m)}
                  aria-pressed={modeFilter === m}
                >
                  {m === 'ALL' ? 'WSZYSTKIE' : MODE_METADATA[m].label}
                </button>
              ))}
            </div>

            {/* Duration Filter */}
            <div
              role="group"
              aria-label="Filtruj według czasu sesji"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  marginRight: '0.25rem',
                }}
              >
                CZAS:
              </span>
              {(['ALL', 30, 60] as const).map((d) => (
                <button
                  key={String(d)}
                  type="button"
                  className={`btn btn-sm ${durationFilter === d ? 'btn-cyan' : ''}`}
                  onClick={() => setDurationFilter(d)}
                  aria-pressed={durationFilter === d}
                >
                  {d === 'ALL' ? 'WSZYSTKIE' : `${d} SEKUND`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredScores.length === 0 ? (
          <div
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div
              style={{
                fontSize: '1.1rem',
                color: 'var(--neon-cyan)',
                fontWeight: 700,
                marginBottom: '0.5rem',
              }}
            >
              [ BRAK ZAREJESTROWANYCH WYNIKÓW DLA WYBRANYCH FILTRÓW ]
            </div>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
              }}
            >
              Rozegraj pierwszą sesję i zapisz swoje imię na szczycie tabeli!
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStartChallenge}
            >
              ROZPOCZNIJ PIERWSZĄ GRĘ
            </button>
          </div>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>POZYCJA</th>
                  <th>GRACZ (NICK)</th>
                  <th>WYNIK (PKT)</th>
                  <th>WPM</th>
                  <th>CELNOŚĆ</th>
                  <th>BŁĘDY</th>
                  <th>TRYB / CZAS</th>
                  <th>GODZINA</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map((entry, idx) => {
                  const rank = idx + 1;
                  const isCurrentRun = latestScoreId === entry.id;
                  const rowClasses = [
                    rank <= 3 ? `row-rank-${rank}` : '',
                    isCurrentRun ? 'row-current-player' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  const modeAccent =
                    entry.mode === 'EASY'
                      ? 'var(--neon-green)'
                      : entry.mode === 'HACKER'
                        ? 'var(--neon-cyan)'
                        : 'var(--neon-amber)';

                  return (
                    <tr key={entry.id} className={rowClasses}>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '34px',
                            padding: '0.2rem 0.45rem',
                            fontWeight: 800,
                            border: '1px solid',
                            borderColor:
                              rank === 1
                                ? 'var(--neon-green)'
                                : rank === 2
                                  ? 'var(--neon-cyan)'
                                  : rank === 3
                                    ? 'var(--neon-amber)'
                                    : 'var(--border-subtle)',
                            color:
                              rank === 1
                                ? 'var(--neon-green)'
                                : rank === 2
                                  ? 'var(--neon-cyan)'
                                  : rank === 3
                                    ? 'var(--neon-amber)'
                                    : 'var(--text-secondary)',
                          }}
                        >
                          #{rank}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 700,
                          }}
                        >
                          <span>{entry.nickname}</span>
                          {isCurrentRun && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                padding: '0.1rem 0.4rem',
                                background: 'var(--neon-green)',
                                color: '#040805',
                                fontWeight: 800,
                              }}
                            >
                              TWÓJ WYNIK
                            </span>
                          )}
                          {entry.isDemo && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                padding: '0.1rem 0.4rem',
                                border: '1px solid var(--neon-amber)',
                                color: 'var(--neon-amber)',
                              }}
                            >
                              DEMO
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong
                          style={{
                            color: rank === 1 ? 'var(--neon-green)' : 'var(--text-primary)',
                            fontSize: '1.02rem',
                          }}
                        >
                          {entry.score}
                        </strong>
                      </td>

                      <td style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                        {entry.wpm} WPM
                      </td>

                      <td>{entry.accuracy.toFixed(1)}%</td>

                      <td
                        style={{
                          color: entry.errors === 0 ? 'var(--neon-green)' : 'var(--text-secondary)',
                        }}
                      >
                        {entry.errors}
                      </td>

                      <td>
                        <span style={{ color: modeAccent, fontWeight: 600 }}>
                          {MODE_METADATA[entry.mode].label}
                        </span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>({entry.duration}s)</span>
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>
                        {formatTimestamp(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
