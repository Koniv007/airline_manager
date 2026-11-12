// Minimal game state store (no extra libraries).
// UI reads state via useGameState() and changes it only through the functions below.
import { useSyncExternalStore } from "react";
import { clockAt, type GameClock } from "../simulation/gameClock.ts";
import { rulesFor, type WorldMode } from "../worlds/worldRules.ts";
import { worldKey, type GameServer } from "../worlds/serverList.ts";
import { appStorage } from "../persistence/storage.ts";
import { loadSave, registerMember, writeSave, type SavedAirline } from "../persistence/saveGame.ts";

import type { PlayerAircraft } from "../fleet/types.ts";
import {
  buyAircraftAction,
  leaseAircraftAction,
  sellAircraftAction,
  returnLeasedAircraftAction,
  type TransactionResult,
} from "../fleet/fleetService.ts";

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
  readonly fleet: readonly PlayerAircraft[];
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
    fleet: [],
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

import type { BuyAircraftOptions } from "../fleet/fleetService.ts";

export function buyAircraft(
  modelId: string,
  options?: BuyAircraftOptions,
): TransactionResult {
  const result = buyAircraftAction(state, modelId, options);
  if (result.success && result.newState) {
    setState(result.newState);
  }
  return result;
}

export function leaseAircraft(
  modelId: string,
  options?: { customRegistration?: string; nickname?: string },
): TransactionResult {
  const result = leaseAircraftAction(state, modelId, options);
  if (result.success && result.newState) {
    setState(result.newState);
  }
  return result;
}

export function sellAircraft(aircraftId: string): TransactionResult {
  const result = sellAircraftAction(state, aircraftId);
  if (result.success && result.newState) {
    setState(result.newState);
  }
  return result;
}

export function returnLeasedAircraft(aircraftId: string): TransactionResult {
  const result = returnLeasedAircraftAction(state, aircraftId);
  if (result.success && result.newState) {
    setState(result.newState);
  }
  return result;
}

export function leaveWorld(): void {
  const idle = createWorldState(
    { id: "idle", name: "–", mode: "career", season: 1, players: 0, capacity: 250, worldStartMs: Date.now() },
    { id: "", displayName: "Player", isGuest: true },
    Date.now(),
  );
  setState(idle);
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


