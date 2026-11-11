import type { User } from "../../auth/authService.ts";
import { CAREER_STARTING_CASH, type WorldMode } from "../../worlds/worldRules.ts";
import { formatMoney } from "../../economy/money.ts";
import Backdrop from "../Backdrop.tsx";

interface Props {
  user: User;
  onSelect: (mode: WorldMode) => void;
  onSignOut: () => void;
}

function CareerArt() {
  return (
    <svg className="world-art" viewBox="0 0 220 100" aria-hidden="true">
      <defs>
        <linearGradient id="gbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffc857" /><stop offset="1" stopColor="#b45309" /></linearGradient>
      </defs>
      {[18, 30, 24, 44, 38, 60, 72].map((h, i) => (
        <rect key={i} x={14 + i * 29} y={92 - h} width="20" height={h} rx="3" fill="url(#gbar)" opacity={0.35 + i * 0.09} />
      ))}
      <polyline className="draw" points="24,70 53,58 82,64 111,42 140,48 169,28 198,14" fill="none" stroke="#ffe29a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="198" cy="14" r="5" fill="#fff" className="pulse-dot" />
    </svg>
  );
}

function SandboxArt() {
  return (
    <svg className="world-art" viewBox="0 0 220 100" aria-hidden="true">
      <defs>
        <linearGradient id="gloop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#3b9eff" /></linearGradient>
      </defs>
      <path className="loop" d="M60,50 C60,22 100,22 110,50 C120,78 160,78 160,50 C160,22 120,22 110,50 C100,78 60,78 60,50Z"
        fill="none" stroke="url(#gloop)" strokeWidth="5" strokeLinecap="round" />
      {[[22, 22], [196, 20], [30, 80], [190, 82], [110, 10]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#9bd3ff" className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </svg>
  );
}

export default function WorldSelectScreen({ user, onSelect, onSignOut }: Props) {
  return (
    <div className="screen">
      <Backdrop />
      <div className="panel wide">
        <div className="panel-head">
          <div>
            <h1>Welcome, {user.displayName}</h1>
            <p className="tagline">Choose your world</p>
          </div>
          <button className="secondary" onClick={onSignOut}>{user.isGuest ? "Exit guest mode" : "Log out"}</button>
        </div>
        {user.isGuest && (
          <div className="banner">Playing as a guest: your progress is saved only on this device. Create an account to play from anywhere.</div>
        )}
        <div className="world-cards">
          <button className="world-card career" onClick={() => onSelect("career")}>
            <CareerArt />
            <h2>Career</h2>
            <p>Start small and grow into a major international airline.</p>
            <div className="chips">
              <span>{formatMoney(CAREER_STARTING_CASH)} start</span>
              <span>Historical aircraft</span>
              <span>Reputation</span>
            </div>
            <span className="cta">Choose Career →</span>
          </button>
          <button className="world-card sandbox" onClick={() => onSelect("sandbox")}>
            <SandboxArt />
            <h2>Sandbox</h2>
            <p>Total freedom. Build any airline you can imagine.</p>
            <div className="chips">
              <span>∞ money</span>
              <span>All aircraft unlocked</span>
              <span>No restrictions</span>
            </div>
            <span className="cta">Choose Sandbox →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
