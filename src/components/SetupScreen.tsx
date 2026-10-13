import React, { useState } from 'react';
import { MODE_METADATA, PASSAGES } from '../data/passages';
import { GameDuration, GameMode } from '../types/game';
import {
  getNicknameSuggestions,
  MAX_NICKNAME_LENGTH,
  validateNickname,
} from '../utils/validation';

interface SetupScreenProps {
  initialNickname: string;
  initialMode: GameMode;
  initialDuration: GameDuration;
  onStartGame: (nickname: string, mode: GameMode, duration: GameDuration) => void;
  onBackToHome: () => void;
}

const MODES_ORDER: GameMode[] = ['EASY', 'HACKER', 'CODE'];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  initialNickname,
  initialMode,
  initialDuration,
  onStartGame,
  onBackToHome,
}) => {
  const [nickname, setNickname] = useState(initialNickname);
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [duration, setDuration] = useState<GameDuration>(initialDuration);
  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const [touched, setTouched] = useState(false);

  const suggestions = getNicknameSuggestions(4, suggestionSeed);
  const validation = validateNickname(nickname);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.valid) {
      return;
    }
    onStartGame(validation.sanitized, mode, duration);
  };

  const handleSelectSuggestion = (suggested: string) => {
    setNickname(suggested);
    setTouched(false);
  };

  const selectedMeta = MODE_METADATA[mode];
  const samplePassage = PASSAGES[mode][0]?.text || '';

  return (
    <section className="setup-container" aria-label="Konfiguracja gracza i sesji">
      <div className="terminal-panel accent-green">
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot green" />
            <span className="panel-dot cyan" />
            <span style={{ marginLeft: '0.4rem' }}>TERMINAL://PLAYER_SETUP</span>
          </div>
          <span>KROK 1 Z 1 // KONFIGURACJA WYZWANIA</span>
        </div>

        <form className="setup-body" onSubmit={handleSubmit} noValidate>
          {/* Step 1: Nickname */}
          <div>
            <label htmlFor="player-nickname-input" className="field-label">
              <span>01 // IDENTYFIKATOR GRACZA (NICKNAME)</span>
              <span>
                {nickname.trim().length}/{MAX_NICKNAME_LENGTH} ZNAKÓW
              </span>
            </label>

            <div className="terminal-input-wrap">
              <span className="terminal-input-prefix" aria-hidden="true">
                &gt;_
              </span>
              <input
                id="player-nickname-input"
                type="text"
                className="terminal-text-input"
                value={nickname}
                maxLength={MAX_NICKNAME_LENGTH}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (!touched) setTouched(true);
                }}
                placeholder="Wpisz swój nick lub wybierz poniżej..."
                autoFocus
                autoComplete="off"
                spellCheck={false}
                aria-invalid={touched && !validation.valid}
                aria-describedby="nickname-feedback"
              />
            </div>

            {touched && !validation.valid && (
              <div
                id="nickname-feedback"
                role="alert"
                style={{
                  marginTop: '0.45rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--neon-red)',
                }}
              >
                ! {validation.error}
              </div>
            )}

            <div className="suggestion-chips" aria-label="Szybkie propozycje nicków">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.73rem',
                  color: 'var(--text-muted)',
                }}
              >
                Szybki wybór:
              </span>
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip-btn"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                className="chip-btn"
                onClick={() => setSuggestionSeed((s) => s + 4)}
                style={{ color: 'var(--neon-cyan)', borderColor: 'var(--border-cyan)' }}
              >
                &#x21bb; INNE PROPOZYCJE
              </button>
            </div>
          </div>

          {/* Step 2: Mode Selection */}
          <div>
            <div className="field-label">
              <span>02 // WYBIERZ TRYB GRY</span>
              <span>POZIOM TRUDNOŚCI</span>
            </div>

            <div className="modes-grid" role="radiogroup" aria-label="Tryb gry">
              {MODES_ORDER.map((modeKey) => {
                const meta = MODE_METADATA[modeKey];
                const isSelected = mode === modeKey;
                const selectedClass = isSelected ? `selected-${meta.accentColor}` : '';

                const accentVar =
                  meta.accentColor === 'green'
                    ? 'var(--neon-green)'
                    : meta.accentColor === 'cyan'
                      ? 'var(--neon-cyan)'
                      : 'var(--neon-amber)';

                return (
                  <button
                    key={modeKey}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`mode-card ${selectedClass}`}
                    onClick={() => setMode(modeKey)}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          color: accentVar,
                        }}
                      >
                        <span>{meta.badge}</span>
                        <span>[{meta.difficulty}]</span>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: isSelected ? accentVar : 'var(--text-primary)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {meta.label}
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {meta.polishTitle}
                      </div>

                      <p
                        style={{
                          fontSize: '0.84rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.45,
                        }}
                      >
                        {meta.description}
                      </p>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: isSelected ? accentVar : 'var(--text-muted)',
                        borderTop: '1px solid var(--border-dim)',
                        paddingTop: '0.55rem',
                      }}
                    >
                      {isSelected ? '✓ AKTYWNY TRYB' : 'KLIKNIJ ABY WYBRAĆ'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mode Instructions & Sample Preview */}
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.85rem 1.1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ color: 'var(--neon-cyan)' }}>
                <strong>INSTRUKCJA ({selectedMeta.label}):</strong> {selectedMeta.instructions}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                PRZYKŁAD: &ldquo;{samplePassage}&rdquo;
              </div>
            </div>
          </div>

          {/* Step 3: Duration Selection */}
          <div>
            <div className="field-label">
              <span>03 // CZAS TRWANIA SESJI</span>
              <span>DOMYŚLNIE 30S (SZYBKA ROZGRYWKA)</span>
            </div>

            <div className="duration-selector" role="radiogroup" aria-label="Czas trwania sesji">
              <button
                type="button"
                role="radio"
                aria-checked={duration === 30}
                className={`duration-btn ${duration === 30 ? 'active' : ''}`}
                onClick={() => setDuration(30)}
              >
                <span>30 SEKUND // SZYBKI SPRINT</span>
                <span style={{ fontSize: '0.74rem' }}>POLECANE NA STOISKO</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={duration === 60}
                className={`duration-btn ${duration === 60 ? 'active' : ''}`}
                onClick={() => setDuration(60)}
              >
                <span>60 SEKUND // PEŁNA MINUTA</span>
                <span style={{ fontSize: '0.74rem' }}>MARATON PRECYZJI</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-dim)',
              flexWrap: 'wrap',
            }}
          >
            <button type="button" className="btn" onClick={onBackToHome}>
              &larr; POWRÓT DO MENU
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Naciśnij [ENTER] aby wystartować
              </span>
              <button
                type="submit"
                className="btn btn-primary btn-hero"
                onClick={() => setTouched(true)}
              >
                START
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
