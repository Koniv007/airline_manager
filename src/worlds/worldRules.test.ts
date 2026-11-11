import { test } from "node:test";
import assert from "node:assert/strict";
import { CAREER_STARTING_CASH, isAircraftAvailable, rulesFor } from "./worldRules.ts";

// Synthetic fixture, not a real aircraft.
const modernGiant = { introductionYear: 2007 };

test("career starts with limited money", () => {
  assert.equal(rulesFor("career").startingCash, CAREER_STARTING_CASH);
});
test("sandbox has unlimited money", () => {
  assert.equal(rulesFor("sandbox").startingCash, null);
});
test("career: an aircraft from 2007 is locked in 1975", () => {
  assert.equal(isAircraftAvailable(modernGiant, 1975, rulesFor("career")), false);
});
test("career: the aircraft unlocks in its introduction year", () => {
  assert.equal(isAircraftAvailable(modernGiant, 2006, rulesFor("career")), false);
  assert.equal(isAircraftAvailable(modernGiant, 2007, rulesFor("career")), true);
});
test("sandbox: everything is available even in 1975", () => {
  assert.equal(isAircraftAvailable(modernGiant, 1975, rulesFor("sandbox")), true);
});
