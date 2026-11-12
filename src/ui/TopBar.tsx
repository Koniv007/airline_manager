import { useState } from "react";
import { useGameState } from "../game/gameStore.ts";
import { formatDate, formatTime } from "../simulation/gameClock.ts";
import { formatMoney } from "../economy/money.ts";
import { useGameTime } from "./useGameTime.ts";
import { resetAllGameData } from "../persistence/resetGame.ts";

interface TopBarProps {
  onLeave: () => void;
  onReset?: () => void;
}

export default function TopBar({ onLeave, onReset }: TopBarProps) {
  const { airlineName, cash, mode, serverName, isGuest } = useGameState();
  const { clock, hour, minute, secondsToNextDay, phase } = useGameTime();
  const [h, m] = formatTime(hour, minute).split(":");
  const next = `${Math.floor(secondsToNextDay / 60)}:${String(secondsToNextDay % 60).padStart(2, "0")}`;
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleConfirmReset = () => {
    resetAllGameData();
    setShowResetConfirm(false);
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="logo">✈</span> {airlineName}{" "}
          <span className={`badge ${mode}`}>
            {mode} · {serverName}
          </span>
          {isGuest && (
            <span className="badge guest" title="Progress is saved only on this device">
              Guest
            </span>
          )}
        </div>
        <div className="clock">
          <span className="clock-icon">{phase === "night" ? "☾" : "☀"}</span>
          <div>
            <div className="clock-date">{formatDate(clock)}</div>
            <div className="clock-time">
              {h}
              <span className="colon">:</span>
              {m}
            </div>
          </div>
          <div className="clock-next">
            next day<br />in {next}
          </div>
        </div>
        <div className="stat">
          <span className="stat-label">Pace</span>
          <span className="stat-value">1 day = 3.5 min</span>
        </div>
        <div className="stat">
          <span className="stat-label">Cash</span>
          <span className="stat-value gold">{formatMoney(cash)}</span>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="secondary danger-btn topbar-reset-btn"
            onClick={() => setShowResetConfirm(true)}
            title="Reset all game data (temporary debug feature)"
          >
            ↺ Reset Game
          </button>
          <button type="button" className="secondary" onClick={onLeave}>
            Leave world
          </button>
        </div>
      </header>

      {/* Confirmation Modal for Resetting the Game */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div className="panel modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Entire Game</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowResetConfirm(false)}
              >
                ✕
              </button>
            </div>
            <p className="confirm-text">
              Are you sure you want to <b>reset all game data</b>?
              <br />
              This will wipe all active worlds, saved airlines, finances, and local storage data,
              returning the simulation to a clean, fresh state.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary danger-btn"
                onClick={handleConfirmReset}
              >
                Confirm & Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
