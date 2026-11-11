import type { WorldMode } from "./worldRules.ts";
import { WORLD_LENGTH_MS } from "../simulation/gameClock.ts";

export const SERVER_CAPACITY = 250;

export interface GameServer {
  readonly id: string;
  readonly name: string;
  readonly mode: WorldMode;
  /** When a world reaches 31 Dec 2040 a new season starts on the same server. */
  readonly season: number;
  readonly players: number;
  readonly capacity: number;
  /** Real time when the current season began (all players on the server share it). */
  readonly worldStartMs: number;
}

export type ServerStatus = "open" | "busy" | "full";

export function serverStatus(s: GameServer): ServerStatus {
  if (s.players >= s.capacity) return "full";
  return s.players >= s.capacity * 0.8 ? "busy" : "open";
}

export function canJoin(s: GameServer): boolean {
  return s.players < s.capacity;
}

/** A player who already has an airline on a server can always continue, even when it is full. */
export function canEnter(s: GameServer, alreadyPlaying: boolean): boolean {
  return alreadyPlaying || canJoin(s);
}

/** Saves and player lists are kept per season: a new season is a fresh world. */
export function worldKey(s: Pick<GameServer, "id" | "season">): string {
  return `${s.id}-s${s.season}`;
}

interface ServerDef {
  readonly id: string;
  readonly name: string;
  readonly mode: WorldMode;
  readonly launchMs: number; // fixed: the server has been running since this moment
}

// Test servers. They never stop: the date is always calculated from the launch time.
const SERVER_DEFS: readonly ServerDef[] = [
  { id: "career-1", name: "Career 1", mode: "career", launchMs: Date.parse("2026-11-01T00:00:00Z") },
  { id: "career-2", name: "Career 2", mode: "career", launchMs: Date.parse("2026-11-06T00:00:00Z") },
  { id: "career-3", name: "Career 3", mode: "career", launchMs: Date.parse("2026-11-10T00:00:00Z") },
  { id: "sandbox-1", name: "Sandbox 1", mode: "sandbox", launchMs: Date.parse("2026-11-01T00:00:00Z") },
  { id: "sandbox-2", name: "Sandbox 2", mode: "sandbox", launchMs: Date.parse("2026-11-06T00:00:00Z") },
  { id: "sandbox-3", name: "Sandbox 3", mode: "sandbox", launchMs: Date.parse("2026-11-10T00:00:00Z") },
];

export function currentSeason(launchMs: number, nowMs: number): number {
  return Math.floor(Math.max(0, nowMs - launchMs) / WORLD_LENGTH_MS) + 1;
}

/**
 * The servers of one world type, as they are at time `nowMs`.
 * `playersIn` tells how many players a world has (0 until somebody joins).
 */
export function serversFor(
  mode: WorldMode,
  nowMs: number,
  playersIn: (worldKey: string) => number = () => 0,
): GameServer[] {
  return SERVER_DEFS.filter((d) => d.mode === mode).map((d) => {
    const season = currentSeason(d.launchMs, nowMs);
    return {
      id: d.id,
      name: d.name,
      mode: d.mode,
      season,
      players: playersIn(worldKey({ id: d.id, season })),
      capacity: SERVER_CAPACITY,
      worldStartMs: d.launchMs + (season - 1) * WORLD_LENGTH_MS,
    };
  });
}

export function msUntilSeasonEnds(s: GameServer, nowMs: number): number {
  return Math.max(0, s.worldStartMs + WORLD_LENGTH_MS - nowMs);
}
