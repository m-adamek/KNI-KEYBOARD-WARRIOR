import React from 'react';
import { AppScreen } from '../types/game';
import { StorageBackendStatus } from '../services/storage';

interface HeaderProps {
  currentScreen: AppScreen;
  activeNickname: string;
  isGameRunning: boolean;
  kioskMode: boolean;
  backendStatus: StorageBackendStatus;
  includeDemo: boolean;
  onNavigateHome: () => void;
  onNavigateLeaderboard: () => void;
  onStartNewPlayer: () => void;
  onToggleKiosk: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeNickname,
  isGameRunning,
  kioskMode,
  backendStatus,
  includeDemo,
  onNavigateHome,
  onNavigateLeaderboard,
  onStartNewPlayer,
  onToggleKiosk,
}) => {
  const statusLabel =
    currentScreen === 'GAME'
      ? isGameRunning
        ? 'INPUT DETECTED // RUN ACTIVE'
        : 'TERMINAL READY // AWAITING KEY'
      : currentScreen === 'RESULTS'
        ? 'SESSION COMPLETE'
        : 'SYSTEM ONLINE';

  const statusClass =
    currentScreen === 'GAME' && isGameRunning
      ? 'cyan'
      : currentScreen === 'RESULTS'
        ? 'amber'
        : 'online';

  const storageLabel =
    backendStatus === 'server-sqlite'
      ? 'DB: SQLITE SYNC'
      : backendStatus === 'server-json'
        ? 'DB: SERVER SYNC'
        : backendStatus === 'local-storage'
          ? 'DB: LOCAL STORAGE'
          : 'DB: MEMORY';

  return (
    <header className="top-header" role="banner">
      <div className="top-header-inner">
        <button
          type="button"
          className="brand-cluster"
          onClick={onNavigateHome}
          title="Powrót do ekranu głównego KEYBOARD WARRIOR"
          aria-label="KEYBOARD WARRIOR — Ekran główny"
        >
          <div className="brand-logo-box" aria-hidden="true">
            &gt;_
          </div>
          <div>
            <div className="brand-title">
              <span>KEYBOARD WARRIOR</span>
            </div>
            <span className="brand-club-tag">
              KOŁO NAUKOWE INFORMATYKÓW // WYDZIAŁ INFORMATYKI
            </span>
          </div>
        </button>

        <div className="header-status-group">
          <div className={`status-pill ${statusClass}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            <span>{statusLabel}</span>
          </div>

          {!kioskMode && (
            <div
              className="status-pill"
              title="Status zapisu wyników rankingu"
            >
              <span>{storageLabel}</span>
            </div>
          )}

          {includeDemo && (
            <div className="status-pill amber" title="Rekordy demonstracyjne są obecnie widoczne">
              <span>TRYB DEMO AKTYWNY</span>
            </div>
          )}

          {activeNickname && currentScreen !== 'HOME' && (
            <div className="status-pill cyan">
              <span>GRACZ: {activeNickname}</span>
            </div>
          )}

          <nav aria-label="Nawigacja główna" style={{ display: 'flex', gap: '0.5rem' }}>
            {currentScreen !== 'HOME' && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={onNavigateHome}
              >
                MENU
              </button>
            )}

            {currentScreen !== 'LEADERBOARD' && currentScreen !== 'GAME' && (
              <button
                type="button"
                className="btn btn-sm btn-cyan"
                onClick={onNavigateLeaderboard}
              >
                LEADERBOARD
              </button>
            )}

            {currentScreen !== 'SETUP' && currentScreen !== 'GAME' && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={onStartNewPlayer}
              >
                NOWY GRACZ
              </button>
            )}

            {!isGameRunning && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={onToggleKiosk}
                title="Przełącz tryb pełnoekranowy / stoiskowy"
                aria-pressed={kioskMode}
              >
                {kioskMode ? 'KIOSK: WŁ.' : 'KIOSK'}
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
