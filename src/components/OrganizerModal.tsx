import React, { useState } from 'react';
import { StorageBackendStatus } from '../services/storage';

interface OrganizerModalProps {
  isOpen: boolean;
  includeDemo: boolean;
  totalRealCount: number;
  totalDemoCount: number;
  backendStatus: StorageBackendStatus;
  onClose: () => void;
  onToggleIncludeDemo: (include: boolean) => void;
  onSeedDemo: () => Promise<void>;
  onClearDemo: () => Promise<void>;
  onResetAllScores: () => Promise<void>;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  isOpen,
  includeDemo,
  totalRealCount,
  totalDemoCount,
  backendStatus,
  onClose,
  onToggleIncludeDemo,
  onSeedDemo,
  onClearDemo,
  onResetAllScores,
}) => {
  const [confirmResetStep, setConfirmResetStep] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handleSeedDemo = async () => {
    setIsBusy(true);
    try {
      await onSeedDemo();
      onToggleIncludeDemo(true);
      setStatusMessage('Załadowano 5 demonstracyjnych rekordów [DEMO] i włączono ich podgląd.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleClearDemo = async () => {
    setIsBusy(true);
    try {
      await onClearDemo();
      onToggleIncludeDemo(false);
      setStatusMessage('Usunięto wszystkie rekordy demonstracyjne [DEMO].');
    } finally {
      setIsBusy(false);
    }
  };

  const handleExecuteReset = async () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      return;
    }
    setIsBusy(true);
    try {
      await onResetAllScores();
      setConfirmResetStep(false);
      setConfirmText('');
      onToggleIncludeDemo(false);
      setStatusMessage('Wyczyszczono wszystkie wyniki wydarzenia.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="organizer-modal-title"
      onClick={onClose}
    >
      <div
        className="terminal-panel accent-amber modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header-bar">
          <div className="panel-dots">
            <span className="panel-dot amber" />
            <span style={{ marginLeft: '0.4rem' }}>ADMIN://ORGANIZER_UTILITIES</span>
          </div>
          <span>NARZĘDZIA STOISKA KNI</span>
        </div>

        <div
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.35rem',
          }}
        >
          <div>
            <h2
              id="organizer-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                letterSpacing: '0.05em',
                color: 'var(--neon-amber)',
                marginBottom: '0.3rem',
              }}
            >
              PANEL ORGANIZATORA WYDARZENIA
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Zarządzanie danymi demonstracyjnymi oraz bezpieczny reset tabeli wyników podczas Dnia Otwartego.
            </p>
          </div>

          {/* Storage & Record Counter */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div className="stat-tile">
              <div className="stat-tile-label">WYNIKI GRACZY</div>
              <div className="stat-tile-value green">{totalRealCount}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">REKORDY [DEMO]</div>
              <div className="stat-tile-value amber">{totalDemoCount}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">SILNIK BAZY</div>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--neon-cyan)',
                  marginTop: '0.35rem',
                }}
              >
                {backendStatus.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Demo Data Controls */}
          <div
            style={{
              padding: '1.1rem',
              background: 'var(--bg-panel-elevated)',
              border: '1px solid var(--border-dim)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--neon-cyan)',
                fontWeight: 700,
              }}
            >
              1. DANE DEMONSTRACYJNE (PREZENTACJA STOISKA)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Rekordy demo są wyraźnie oznaczone etykietą <code>[DEMO]</code> i domyślnie ukryte w oficjalnym rankingu.
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-cyan"
                disabled={isBusy}
                onClick={handleSeedDemo}
              >
                ZAŁADUJ REKORDY DEMO
              </button>

              <button
                type="button"
                className="btn btn-sm"
                disabled={isBusy}
                onClick={() => onToggleIncludeDemo(!includeDemo)}
              >
                {includeDemo ? 'UKRYJ REKORDY DEMO' : 'POKAŻ REKORDY DEMO'}
              </button>

              <button
                type="button"
                className="btn btn-sm"
                disabled={isBusy || totalDemoCount === 0}
                onClick={handleClearDemo}
              >
                USUŃ REKORDY DEMO
              </button>
            </div>
          </div>

          {/* Destructive Reset Section with Two-Step Confirmation */}
          <div
            style={{
              padding: '1.1rem',
              background: 'rgba(255, 51, 102, 0.06)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--neon-red)',
                fontWeight: 700,
              }}
            >
              2. STREFA NIEBEZPIECZNA — RESET CAŁEGO WYDARZENIA
            </div>

            {!confirmResetStep ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Usuwa trwale wszystkie zapisane wyniki graczy oraz dane demo.
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={isBusy}
                  onClick={() => setConfirmResetStep(true)}
                >
                  RESETUJ WSZYSTKIE WYNIKI...
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <label
                  htmlFor="confirm-reset-input"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: 'var(--neon-red)',
                  }}
                >
                  Aby potwierdzić usunięcie wszystkich wyników, wpisz słowo <strong>RESET</strong>:
                </label>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <input
                    id="confirm-reset-input"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Wpisz RESET"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--neon-red)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    disabled={isBusy || confirmText.trim().toUpperCase() !== 'RESET'}
                    onClick={handleExecuteReset}
                  >
                    POTWIERDŹ TRWAŁY RESET
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setConfirmResetStep(false);
                      setConfirmText('');
                    }}
                  >
                    ANULUJ
                  </button>
                </div>
              </div>
            )}
          </div>

          {statusMessage && (
            <div
              role="status"
              style={{
                padding: '0.65rem 0.9rem',
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid var(--border-green)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--neon-green)',
              }}
            >
              &gt; {statusMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              ZAMKNIJ PANEL [ESC]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
