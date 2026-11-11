import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSave, saveKey, writeSave } from "./saveGame.ts";
import type { KeyValueStorage } from "../auth/authService.ts";

function memory(): KeyValueStorage {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

test("a save can be written and loaded", () => {
  const s = memory();
  writeSave(s, "u1", "career-1", { airlineName: "Jan’s Airline", cash: 1_234_567 });
  assert.deepEqual(loadSave(s, "u1", "career-1"), { airlineName: "Jan’s Airline", cash: 1_234_567 });
});
test("unlimited cash survives saving", () => {
  const s = memory();
  writeSave(s, "u1", "sandbox-1", { airlineName: "A", cash: Infinity });
  assert.equal(loadSave(s, "u1", "sandbox-1")?.cash, Infinity);
});
test("saves are separate per player and per server", () => {
  const s = memory();
  writeSave(s, "u1", "career-1", { airlineName: "A", cash: 1 });
  assert.equal(loadSave(s, "u2", "career-1"), null);
  assert.equal(loadSave(s, "u1", "career-2"), null);
});
test("a corrupted save is ignored, not a crash", () => {
  const s = memory();
  s.setItem(saveKey("u1", "x"), "{not json");
  assert.equal(loadSave(s, "u1", "x"), null);
  s.setItem(saveKey("u1", "x"), JSON.stringify({ version: 99 }));
  assert.equal(loadSave(s, "u1", "x"), null);
});

import { memberCount, registerMember } from "./saveGame.ts";
test("member count starts at 0 and counts each player once", () => {
  const s = memory();
  assert.equal(memberCount(s, "career-1-s1"), 0);
  registerMember(s, "career-1-s1", "u1");
  registerMember(s, "career-1-s1", "u1");
  registerMember(s, "career-1-s1", "u2");
  assert.equal(memberCount(s, "career-1-s1"), 2);
  assert.equal(memberCount(s, "career-2-s1"), 0);
});
test("a corrupted member list counts as empty", () => {
  const s = memory();
  s.setItem("airline-manager-members:x", "{oops");
  assert.equal(memberCount(s, "x"), 0);
});
