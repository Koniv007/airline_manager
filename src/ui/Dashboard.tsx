import { useGameState } from "../game/gameStore.ts";
import { formatMoney } from "../economy/money.ts";
import { isWorldOver, worldProgress } from "../simulation/gameClock.ts";
import { useGameTime } from "./useGameTime.ts";
import { useNow } from "./useNow.ts";
import { appStorage } from "../persistence/storage.ts";
import { memberCount } from "../persistence/saveGame.ts";
import { WORLD_LENGTH_MS } from "../simulation/gameClock.ts";
import { formatDuration } from "./formatDuration.ts";
import { calculateFleetValue } from "../fleet/fleetService.ts";
import type { TabName } from "./Sidebar.tsx";

const ROUTE = "M-30,150 Q400,-60 830,150";

interface DashboardProps {
  onNavigate?: (tab: TabName) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { cash, airlineName, mode, serverName, serverId, season, worldStartMs, fleet } = useGameState();
  const now = useNow(1000);
  const { clock, hour, minute, phase } = useGameTime();
  const p = (hour * 60 + minute) / 1440;
  const orb = (offset: number) => {
    const q = (p + offset) % 1;
    return { left: `${q * 100}%`, top: `${110 - 95 * Math.sin(2 * Math.PI * (q - 0.25))}px` };
  };
  const progress = worldProgress(clock);
  const fleetValue = calculateFleetValue(fleet);

  return (
    <section>
      <div className="hero" data-phase={phase}>
        <div className="orb sun" style={orb(0)} />
        <div className="orb moon" style={orb(0.5)} />
        <svg className="route" viewBox="0 0 800 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d={ROUTE} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeDasharray="6 8" />
          <g>
            <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
            <path
              fill="#fff"
              transform="scale(1.4) rotate(90) translate(-12 -12)"
              d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            />
          </g>
        </svg>
        <div className="hero-text">
          <div className="hero-title">Captain’s Dashboard</div>
          <div className="hero-sub">{airlineName} · build the greatest airline in the world</div>
        </div>
      </div>

      <div className="cards">
        <div
          className="card clickable"
          onClick={() => onNavigate?.("Aircraft Market")}
          title="Click to browse Aircraft Market"
        >
          <span className="icon">$</span>
          <h3>Cash</h3>
          <p className="big gold">{formatMoney(cash)}</p>
          <small>available liquid capital</small>
        </div>

        <div
          className="card clickable"
          onClick={() => onNavigate?.("Fleet")}
          title="Click to view your fleet"
        >
          <span className="icon">✈</span>
          <h3>Fleet</h3>
          <p className="big">{fleet.length}</p>
          <small>{fleet.length === 1 ? "1 aircraft" : `${fleet.length} aircraft`}</small>
        </div>

        <div className="card">
          <span className="icon">⇄</span>
          <h3>Routes</h3>
          <p className="big">0</p>
          <small>active routes</small>
        </div>

        <div className="card">
          <span className="icon">★</span>
          <h3>Reputation</h3>
          <p className="big">–</p>
          <small>coming later</small>
        </div>

        <div className="card">
          <span className="icon live-icon">●</span>
          <h3>Server</h3>
          <p className="big">{serverName}</p>
          <small>
            Season {season} · {memberCount(appStorage, serverId)} players · ends in{" "}
            {formatDuration(worldStartMs + WORLD_LENGTH_MS - now)}
          </small>
        </div>
      </div>

      {/* Quick Action Prompt based on Fleet Status */}
      {fleet.length === 0 ? (
        <div className="panel dashboard-banner">
          <div className="dash-banner-content">
            <div>
              <h3>Start building your 1975 fleet!</h3>
              <p>
                Your airline does not yet own or lease any aircraft. Browse the Aircraft Market and acquire
                your first airliner — historic legends like the Boeing 737-200, Boeing 727, DC-9-30, or the
                turboprop Twin Otter are ready for delivery.
              </p>
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => onNavigate?.("Aircraft Market")}
            >
              Open Aircraft Market ⛁
            </button>
          </div>
        </div>
      ) : (
        <div className="panel dashboard-banner">
          <div className="dash-banner-content">
            <div>
              <h3>Active Fleet: {fleet.length} aircraft</h3>
              <p>
                Estimated fair market value of your owned fleet is <b>{formatMoney(fleetValue)}</b>. Next,
                you can expand your fleet or plan passenger routes between hubs.
              </p>
            </div>
            <div className="banner-btns">
              <button
                type="button"
                className="secondary"
                onClick={() => onNavigate?.("Fleet")}
              >
                Manage Fleet ✈
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => onNavigate?.("Aircraft Market")}
              >
                + Acquire Aircraft
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card timeline">
        <h3>World timeline</h3>
        <div className="bar"><div className="fill" style={{ width: `${progress * 100}%` }} /></div>
        <div className="bar-labels"><span>1975</span><span>{(progress * 100).toFixed(2)} %</span><span>2040</span></div>
        {isWorldOver(clock) && <p className="notice">Season finished. A new season is already running on this server: leave the world and join it.</p>}
      </div>
      {mode === "sandbox" && <p className="fine">Sandbox: unlimited money and all aircraft unlocked.</p>}
    </section>
  );
}
