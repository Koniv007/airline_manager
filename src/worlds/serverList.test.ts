import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canEnter, canJoin, currentSeason, msUntilSeasonEnds, SERVER_CAPACITY, serversFor, serverStatus, worldKey,
  type GameServer,
} from "./serverList.ts";
import { clockAt, isWorldOver, formatDate, WORLD_LENGTH_MS } from "../simulation/gameClock.ts";

const NOW = Date.parse("2026-11-11T12:00:00Z");
const base: GameServer = { id: "x", name: "X", mode: "career", season: 1, players: 0, capacity: SERVER_CAPACITY, worldStartMs: NOW };

test("a server holds 250 players", () => {
  assert.equal(SERVER_CAPACITY, 250);
});
test("status: open, busy (80 % or more), full", () => {
  assert.equal(serverStatus({ ...base, players: 199 }), "open");
  assert.equal(serverStatus({ ...base, players: 200 }), "busy");
  assert.equal(serverStatus({ ...base, players: 250 }), "full");
});
test("existing players can continue on a full server, new players cannot join it", () => {
  const full = { ...base, players: 250 };
  assert.equal(canJoin(full), false);
  assert.equal(canEnter(full, true), true);
  assert.equal(canEnter(full, false), false);
});
test("there are three servers per world type, all empty at the start", () => {
  for (const mode of ["career", "sandbox"] as const) {
    const list = serversFor(mode, NOW);
    assert.equal(list.length, 3);
    assert.ok(list.every((s) => s.mode === mode && s.players === 0 && canJoin(s)));
  }
});
test("all servers are running, none has ended", () => {
  const all = [...serversFor("career", NOW), ...serversFor("sandbox", NOW)];
  assert.ok(all.every((s) => !isWorldOver(clockAt(s.worldStartMs, NOW))));
});
test("servers show different dates (different launch times)", () => {
  const dates = serversFor("career", NOW).map((s) => formatDate(clockAt(s.worldStartMs, NOW)));
  assert.equal(new Set(dates).size, 3);
});
test("a server is the same world no matter when you look (it does not restart)", () => {
  const a = serversFor("career", NOW)[0];
  const b = serversFor("career", NOW + 86_400_000)[0];
  assert.equal(a.worldStartMs, b.worldStartMs);
  assert.equal(a.season, 1);
});
test("when a world ends, a new season starts on the same server", () => {
  const launch = Date.parse("2026-11-01T00:00:00Z");
  assert.equal(currentSeason(launch, launch), 1);
  assert.equal(currentSeason(launch, launch + WORLD_LENGTH_MS - 1), 1);
  assert.equal(currentSeason(launch, launch + WORLD_LENGTH_MS), 2);
  const later = serversFor("career", launch + WORLD_LENGTH_MS + 5_000)[0];
  assert.equal(later.season, 2);
  assert.equal(formatDate(clockAt(later.worldStartMs, launch + WORLD_LENGTH_MS + 5_000)), "1. 1. 1975");
  assert.notEqual(worldKey({ id: "career-1", season: 1 }), worldKey({ id: "career-1", season: 2 }));
});
test("last day of a season is shown for one game day before the next season", () => {
  const launch = Date.parse("2026-11-01T00:00:00Z");
  const lastMoment = launch + WORLD_LENGTH_MS - 1;
  const s = serversFor("career", lastMoment)[0];
  assert.equal(formatDate(clockAt(s.worldStartMs, lastMoment)), "31. 12. 2040");
});
test("time until the season ends counts down", () => {
  const s = serversFor("career", NOW)[0];
  assert.ok(msUntilSeasonEnds(s, NOW) > msUntilSeasonEnds(s, NOW + 1000));
});
test("player counts come from the lookup", () => {
  const list = serversFor("sandbox", NOW, (k) => (k === "sandbox-2-s1" ? 7 : 0));
  assert.equal(list.find((s) => s.id === "sandbox-2")!.players, 7);
});
