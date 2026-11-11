// Minimal game state store (no extra libraries).
// UI reads state via useGameState() and changes it only through the functions below.
import { useSyncExternalStore } from "react";
import { clockAt, type GameClock } from "../simulation/gameClock.ts";
import { rulesFor, type WorldMode } from "../worlds/worldRules.ts";
import { worldKey, type GameServer } from "../worlds/serverList.ts";
import { appStorage } from "../persistence/storage.ts";
import { loadSave, registerMember, writeSave, type SavedAirline } from "../persistence/saveGame.ts";

export interface Player {
  readonly id: string;
  readonly displayName: string;
  readonly isGuest: boolean;
}

export interface GameState {
  readonly userId: string;
  readonly isGuest: boolean;
  readonly serverId: string; // world key: server + season
  readonly season: number;
  readonly airlineName: string;
  readonly cash: number; // USD, Infinity in sandbox
  readonly mode: WorldMode;
  readonly serverName: string;
  readonly worldStartMs: number; // real time when this world was created (from the server)
  readonly clock: GameClock;
}

export function createWorldState(
  server: GameServer,
  player: Player,
  nowMs: number,
  saved: SavedAirline | null = null,
): GameState {
  const rules = rulesFor(server.mode);
  return {
    userId: player.id,
    isGuest: player.isGuest,
    serverId: worldKey(server),
    season: server.season,
    airlineName: saved?.airlineName ?? `${player.displayName}’s Airline`,
    cash: saved ? saved.cash : (rules.startingCash ?? Infinity),
    mode: server.mode,
    serverName: server.name,
    worldStartMs: server.worldStartMs,
    clock: clockAt(server.worldStartMs, nowMs),
  };
}

let state: GameState = createWorldState(
  { id: "idle", name: "–", mode: "career", season: 1, players: 0, capacity: 250, worldStartMs: Date.now() },
  { id: "", displayName: "Player", isGuest: true },
  Date.now(),
);
const listeners = new Set<() => void>();

function setState(next: GameState): void {
  state = next;
  listeners.forEach((l) => l());
}

function persist(s: GameState): void {
  if (s.userId) writeSave(appStorage, s.userId, s.serverId, { airlineName: s.airlineName, cash: s.cash });
}

/** The player joins (or continues on) a server. The airline is loaded from the save, or created and saved. */
export function enterWorld(server: GameServer, player: Player, nowMs: number = Date.now()): void {
  const key = worldKey(server);
  const next = createWorldState(server, player, nowMs, loadSave(appStorage, player.id, key));
  persist(next);
  if (player.id) registerMember(appStorage, key, player.id);
  setState(next);
}

/** Called once per real second. Recalculates the date from the real clock. */
export function tick(): void {
  const clock = clockAt(state.worldStartMs, Date.now());
  if (clock.epochDay !== state.clock.epochDay) setState({ ...state, clock });
}

export function useGameState(): GameState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
