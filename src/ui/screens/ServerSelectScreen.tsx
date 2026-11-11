import { serversFor, canEnter, serverStatus, msUntilSeasonEnds, worldKey, SERVER_CAPACITY, type GameServer } from "../../worlds/serverList.ts";
import type { User } from "../../auth/authService.ts";
import type { WorldMode } from "../../worlds/worldRules.ts";
import { appStorage } from "../../persistence/storage.ts";
import { loadSave, memberCount } from "../../persistence/saveGame.ts";
import { clockAt, formatDate, formatTime, timeOfDay, toGameDate, worldProgress } from "../../simulation/gameClock.ts";
import { formatDuration } from "../formatDuration.ts";
import { useNow } from "../useNow.ts";
import Backdrop from "../Backdrop.tsx";

interface Props {
  user: User;
  mode: WorldMode;
  onJoin: (server: GameServer) => void;
  onBack: () => void;
}

const STATUS_LABEL = { open: "Open", busy: "Almost full", full: "Full" } as const;

export default function ServerSelectScreen({ user, mode, onJoin, onBack }: Props) {
  const now = useNow(200);
  const servers = serversFor(mode, now, (key) => memberCount(appStorage, key));
  return (
    <div className="screen">
      <Backdrop />
      <div className="panel wide">
        <div className="panel-head">
          <div>
            <h1>{mode === "career" ? "Career" : "Sandbox"} servers</h1>
            <p className="tagline">All servers run around the clock · up to {SERVER_CAPACITY} players each</p>
          </div>
          <button className="secondary" onClick={onBack}>← Back</button>
        </div>
        <div className="servers">
          {servers.map((s) => {
            const status = serverStatus(s);
            const clock = clockAt(s.worldStartMs, now);
            const t = timeOfDay(s.worldStartMs, now);
            const progress = worldProgress(clock);
            const mine = loadSave(appStorage, user.id, worldKey(s)) !== null;
            return (
              <div className={`server-card ${s.mode}`} key={s.id}>
                <div className="sc-top">
                  <span className="live"><i />Online</span>
                  <h3>{s.name}</h3>
                  <span className="season">Season {s.season}</span>
                  <span className={`tag ${status}`}>{STATUS_LABEL[status]}</span>
                  {mine && <span className="tag mine">Your airline</span>}
                </div>
                <div className="sc-grid">
                  <div className="sc-clock">
                    <div className="sc-date">{formatDate(clock)}</div>
                    <div className="sc-time">{formatTime(t.hour, t.minute)}</div>
                  </div>
                  <div className="sc-world">
                    <div className="bar"><div className="fill" style={{ width: `${progress * 100}%` }} /></div>
                    <div className="bar-labels"><span>1975</span><span>{toGameDate(clock).year}</span><span>2040</span></div>
                    <small>Season ends in {formatDuration(msUntilSeasonEnds(s, now))}</small>
                  </div>
                  <div className="sc-players">
                    <div className="sc-count"><b>{s.players}</b> / {s.capacity}</div>
                    <div className="bar"><div className={`fill ${status}`} style={{ width: `${Math.max(1.5, (s.players / s.capacity) * 100)}%` }} /></div>
                    <small>players</small>
                  </div>
                  <button className="primary" disabled={!canEnter(s, mine)} onClick={() => onJoin(s)}>
                    {mine ? "Continue" : canEnter(s, mine) ? "Join" : "Full"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
