import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorldState, type Player } from "./gameStore.ts";
import { serversFor } from "../worlds/serverList.ts";
import { CAREER_STARTING_CASH } from "../worlds/worldRules.ts";

const NOW = Date.parse("2026-11-11T12:00:00Z");
const jan: Player = { id: "u1", displayName: "Jan", isGuest: false };

test("career world: limited starting money", () => {
  const s = createWorldState(serversFor("career", NOW)[0], jan, NOW);
  assert.equal(s.cash, CAREER_STARTING_CASH);
  assert.equal(s.mode, "career");
});
test("sandbox world: unlimited money", () => {
  const s = createWorldState(serversFor("sandbox", NOW)[0], jan, NOW);
  assert.equal(s.cash, Infinity);
});
test("the player gets the date of the chosen server", () => {
  const young = createWorldState(serversFor("career", NOW)[2], jan, NOW); // launched most recently
  const old = createWorldState(serversFor("career", NOW)[0], jan, NOW); // launched first
  assert.ok(old.clock.epochDay > young.clock.epochDay);
});
test("a saved airline is restored instead of a fresh one", () => {
  const s = createWorldState(serversFor("career", NOW)[0], jan, NOW, { airlineName: "SkyJan", cash: 42 });
  assert.equal(s.airlineName, "SkyJan");
  assert.equal(s.cash, 42);
});
test("guest flag is carried into the game", () => {
  const s = createWorldState(serversFor("career", NOW)[0], { id: "g_1", displayName: "Guest", isGuest: true }, NOW);
  assert.equal(s.isGuest, true);
});
