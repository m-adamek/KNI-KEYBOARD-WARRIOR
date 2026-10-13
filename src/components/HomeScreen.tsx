import React from 'react';
import { MODE_METADATA } from '../data/passages';
import { ScoreEntry } from '../types/game';

interface HomeScreenProps {
  scores: ScoreEntry[];
  onStartChallenge: () => void;
  onViewLeaderboard: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  scores,
  onStartChallenge,
  onViewLeaderboard,
}) => {
  const topThree = scores.slice(0, 3);
  const bestRecord = scores.length > 0 ? scores[0] : null;
  const highestWpm =
    scores.length > 0 ? Math.max(...scores.map((s) => s.wpm)) : 0;

  return (
    <section className="home-grid" aria-label="Ekran startowy KEYBOARD WARRIOR">
      {/* Main Hero Terminal Panel */}
      <div className="terminal-panel accent-green">
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot green" />
            <span className="panel-dot cyan" />
            <span style={{ marginLeft: '0.4rem' }}>TERMINAL://ARCADE_BOOT.SH</span>
          </div>
          <span>STATUS: SYSTEM ONLINE</span>
        </div>

        <div className="hero-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="kni-identity-banner">
              <span>[KNI]</span>
              <span>KOŁO NAUKOWE INFORMATYKÓW // DZIEŃ OTWARTY</span>
            </div>

            <h1 className="hero-main-title">
              KEYBOARD <span className="highlight">WARRIOR</span>
            </h1>

            <p className="hero-subtitle">
              &gt; &ldquo;Mniej klikania. Więcej kodowania.&rdquo;
            </p>

            <p className="hero-pitch">
              Przepisz tekst jak najszybciej i jak najdokładniej. Zdobądź miejsce w rankingu.
            </p>
          </div>

          {/* Primary Arcade CTA & Leaderboard Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              paddingTop: '0.5rem',
            }}
          >
            <button
              type="button"
              className="btn btn-primary btn-hero"
              onClick={onStartChallenge}
              autoFocus
            >
              <span>START CHALLENGE</span>
              <span aria-hidden="true">&rarr;</span>
            </button>

            <button
              type="button"
              className="btn btn-cyan"
              onClick={onViewLeaderboard}
              style={{ padding: '1.05rem 1.5rem' }}
            >
              PEŁNY LEADERBOARD
            </button>
          </div>

          {/* Live Event Stats Strip */}
          <div className="hero-stats-strip">
            <div className="stat-tile">
              <div className="stat-tile-label">NAJLEPSZY WYNIK</div>
              <div className="stat-tile-value green">
                {bestRecord ? `${bestRecord.score} PKT` : '---'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                {bestRecord ? `Lider: ${bestRecord.nickname}` : 'Czeka na rekordzistę'}
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-tile-label">REKORD PRĘDKOŚCI</div>
              <div className="stat-tile-value cyan">
                {highestWpm > 0 ? `${highestWpm} WPM` : '0 WPM'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                Słów na minutę
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-tile-label">ROZEGRANE SESJE</div>
              <div className="stat-tile-value amber">{scores.length}</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                Zapisane w rankingu
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: TOP WARRIORS Preview */}
      <div className="terminal-panel accent-cyan">
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot cyan" />
            <span style={{ marginLeft: '0.4rem' }}>TOP WARRIORS // LIVE PODIUM</span>
          </div>
          <span>TOP 3</span>
        </div>

        <div className="top-warriors-body">
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                TOP WARRIORS
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--neon-cyan)',
                }}
              >
                LIVE RANKING
              </span>
            </div>

            {topThree.length === 0 ? (
              <div
                style={{
                  padding: '2.25rem 1.25rem',
                  textAlign: 'center',
                  border: '1px dashed var(--border-subtle)',
                  background: 'var(--bg-panel-elevated)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--neon-green)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    marginBottom: '0.4rem',
                  }}
                >
                  [ BRAK WYNIKÓW W SESJI ]
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Tablica wyników jest pusta. Rozpocznij wyzwanie i zostań pierwszym liderem dnia otwartego!
                </p>
              </div>
            ) : (
              <div className="podium-list" role="list" aria-label="Czołowa trójka graczy">
                {topThree.map((entry, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={entry.id}
                      role="listitem"
                      className={`podium-item rank-${rank}`}
                    >
                      <div className="rank-badge">#{rank}</div>

                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                          }}
                        >
                          <span>{entry.nickname}</span>
                          {entry.isDemo && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.35rem',
                                border: '1px solid var(--neon-amber)',
                                color: 'var(--neon-amber)',
                              }}
                            >
                              DEMO
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.74rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.15rem',
                          }}
                        >
                          {MODE_METADATA[entry.mode].label} ({entry.duration}s) &bull;{' '}
                          {entry.wpm} WPM &bull; {entry.accuracy.toFixed(1)}%
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '1.15rem',
                            color: rank === 1 ? 'var(--neon-green)' : 'var(--text-primary)',
                          }}
                        >
                          {entry.score}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          PKT
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mode Overview & Full Ranking CTA */}
          <div
            style={{
              borderTop: '1px solid var(--border-dim)',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
              }}
            >
              <div
                style={{
                  padding: '0.45rem 0.6rem',
                  background: 'var(--bg-panel-elevated)',
                  borderLeft: '2px solid var(--neon-green)',
                }}
              >
                <div style={{ color: 'var(--neon-green)', fontWeight: 700 }}>EASY MODE</div>
                <div style={{ color: 'var(--text-secondary)' }}>Polski tekst</div>
              </div>
              <div
                style={{
                  padding: '0.45rem 0.6rem',
                  background: 'var(--bg-panel-elevated)',
                  borderLeft: '2px solid var(--neon-cyan)',
                }}
              >
                <div style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>HACKER MODE</div>
                <div style={{ color: 'var(--text-secondary)' }}>IT &amp; Cybersec</div>
              </div>
              <div
                style={{
                  padding: '0.45rem 0.6rem',
                  background: 'var(--bg-panel-elevated)',
                  borderLeft: '2px solid var(--neon-amber)',
                }}
              >
                <div style={{ color: 'var(--neon-amber)', fontWeight: 700 }}>CODE MODE</div>
                <div style={{ color: 'var(--text-secondary)' }}>Kod JS / TS</div>
              </div>
            </div>

            <button
              type="button"
              className="btn"
              style={{ width: '100%' }}
              onClick={onViewLeaderboard}
            >
              ZOBACZ PEŁNĄ TABELĘ WYNIKÓW ({scores.length})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
