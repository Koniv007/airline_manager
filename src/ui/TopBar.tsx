import { useGameState } from "../game/gameStore.ts";
import { formatDate, formatTime } from "../simulation/gameClock.ts";
import { formatMoney } from "../economy/money.ts";
import { useGameTime } from "./useGameTime.ts";

export default function TopBar({ onLeave }: { onLeave: () => void }) {
  const { airlineName, cash, mode, serverName, isGuest } = useGameState();
  const { clock, hour, minute, secondsToNextDay, phase } = useGameTime();
  const [h, m] = formatTime(hour, minute).split(":");
  const next = `${Math.floor(secondsToNextDay / 60)}:${String(secondsToNextDay % 60).padStart(2, "0")}`;
  return (
    <header className="topbar">
      <div className="brand"><span className="logo">✈</span> {airlineName} <span className={`badge ${mode}`}>{mode} · {serverName}</span>{isGuest && <span className="badge guest" title="Progress is saved only on this device">Guest</span>}</div>
      <div className="clock">
        <span className="clock-icon">{phase === "night" ? "☾" : "☀"}</span>
        <div>
          <div className="clock-date">{formatDate(clock)}</div>
          <div className="clock-time">{h}<span className="colon">:</span>{m}</div>
        </div>
        <div className="clock-next">next day<br />in {next}</div>
      </div>
      <div className="stat">
        <span className="stat-label">Pace</span>
        <span className="stat-value">1 day = 3.5 min</span>
      </div>
      <div className="stat">
        <span className="stat-label">Cash</span>
        <span className="stat-value gold">{formatMoney(cash)}</span>
      </div>
      <button className="secondary" onClick={onLeave}>Leave world</button>
    </header>
  );
}
