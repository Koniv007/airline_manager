import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceDays,
  createClock,
  formatDate,
  isGameFinished,
  toGameDate,
} from "./gameClock.ts";

test("new clock starts on 1 Jan 1975", () => {
  assert.deepEqual(toGameDate(createClock()), { year: 1975, month: 1, day: 1 });
});

test("advancing 31 days from 1 Jan gives 1 Feb", () => {
  assert.equal(formatDate(advanceDays(createClock(), 31)), "1. 2. 1975");
});

test("1976 is a leap year (29 Feb exists)", () => {
  const feb28 = createClock(1976, 2, 28);
  assert.equal(formatDate(advanceDays(feb28, 1)), "29. 2. 1976");
  assert.equal(formatDate(advanceDays(feb28, 2)), "1. 3. 1976");
});

test("1975 is not a leap year", () => {
  assert.equal(formatDate(advanceDays(createClock(1975, 2, 28), 1)), "1. 3. 1975");
});

test("clock rolls over the year", () => {
  assert.equal(formatDate(advanceDays(createClock(1975, 12, 31), 1)), "1. 1. 1976");
});

test("sandbox can start in a custom year", () => {
  assert.equal(toGameDate(createClock(2000)).year, 2000);
});

test("invalid start year is rejected", () => {
  assert.throws(() => createClock(1960), RangeError);
  assert.throws(() => createClock(2041), RangeError);
});

test("negative or fractional days are rejected", () => {
  assert.throws(() => advanceDays(createClock(), -1), RangeError);
  assert.throws(() => advanceDays(createClock(), 1.5), RangeError);
});

test("game finishes after 31 Dec 2040", () => {
  assert.equal(isGameFinished(createClock(2040, 12, 31)), false);
  assert.equal(isGameFinished(advanceDays(createClock(2040, 12, 31), 1)), true);
});

test("1 Jan 1975 + 23741 days is 1 Jan 2040", () => {
  const end = advanceDays(createClock(), 23_741);
  assert.deepEqual(toGameDate(end), { year: 2040, month: 1, day: 1 });
});

// --- Real-time world clock (1 game day = 210 real seconds) ---
import { clockAt, isWorldOver, REAL_SECONDS_PER_GAME_DAY } from "./gameClock.ts";

const T0 = 1_700_000_000_000; // any fixed "world creation" time

test("pace is 3.5 minutes per game day", () => {
  assert.equal(REAL_SECONDS_PER_GAME_DAY, 210);
});

test("at world creation the date is 1 Jan 1975", () => {
  assert.equal(formatDate(clockAt(T0, T0)), "1. 1. 1975");
});

test("the day changes exactly after 210 seconds", () => {
  assert.equal(formatDate(clockAt(T0, T0 + 209_999)), "1. 1. 1975");
  assert.equal(formatDate(clockAt(T0, T0 + 210_000)), "2. 1. 1975");
});

test("1 real hour = 17 game days", () => {
  assert.equal(formatDate(clockAt(T0, T0 + 3_600_000)), "18. 1. 1975");
});

test("1 real day = 411 game days", () => {
  assert.equal(formatDate(clockAt(T0, T0 + 86_400_000)), "16. 2. 1976");
});

test("a clock before world creation stays at the start", () => {
  assert.equal(formatDate(clockAt(T0, T0 - 5_000)), "1. 1. 1975");
});

test("world can start in a custom year", () => {
  assert.equal(formatDate(clockAt(T0, T0, 2000)), "1. 1. 2000");
});

test("clock stops on 31 Dec 2040 and the world is over", () => {
  const far = clockAt(T0, T0 + 100 * 86_400_000);
  assert.equal(formatDate(far), "31. 12. 2040");
  assert.equal(isWorldOver(far), true);
  assert.equal(isWorldOver(clockAt(T0, T0)), false);
});

test("full 1975-2040 world lasts about 58.6 real days", () => {
  const justBefore = clockAt(T0, T0 + 24_105 * 210_000 + 209_000);
  assert.equal(isWorldOver(justBefore), false);
  assert.equal(isWorldOver(clockAt(T0, T0 + 24_106 * 210_000)), true);
});

// --- Time of day ---
import { dayPhase, formatTime, timeOfDay, worldProgress } from "./gameClock.ts";

function at(msAfterStart: number) {
  const t = timeOfDay(T0, T0 + msAfterStart);
  return formatTime(t.hour, t.minute);
}

test("world starts at 00:00", () => {
  assert.equal(at(0), "00:00");
});

test("1 game hour = 8.75 real seconds", () => {
  assert.equal(at(8_749), "00:59");
  assert.equal(at(8_750), "01:00");
});

test("quarter, half and end of a game day", () => {
  assert.equal(at(52_500), "06:00");
  assert.equal(at(105_000), "12:00");
  assert.equal(at(209_999), "23:59");
  assert.equal(at(210_000), "00:00"); // next day begins
});

test("seconds until the next day", () => {
  assert.equal(timeOfDay(T0, T0).secondsToNextDay, 210);
  assert.equal(timeOfDay(T0, T0 + 209_001).secondsToNextDay, 1);
});

test("time stands at 00:00 once the world is over", () => {
  const t = timeOfDay(T0, T0 + 100 * 86_400_000);
  assert.deepEqual(t, { hour: 0, minute: 0, secondsToNextDay: 0 });
});

test("day phases", () => {
  assert.equal(dayPhase(3), "night");
  assert.equal(dayPhase(6), "dawn");
  assert.equal(dayPhase(12), "day");
  assert.equal(dayPhase(18), "dusk");
  assert.equal(dayPhase(22), "night");
});

test("world progress goes from 0 to 1", () => {
  assert.equal(worldProgress(clockAt(T0, T0)), 0);
  assert.equal(worldProgress(clockAt(T0, T0 + 100 * 86_400_000)), 1);
  const half = worldProgress(clockAt(T0, T0 + 12_053 * 210_000));
  assert.ok(half > 0.49 && half < 0.51);
});

import { WORLD_LENGTH_DAYS, WORLD_LENGTH_MS } from "./gameClock.ts";
test("a world lasts 24 107 game days = about 58.6 real days", () => {
  assert.equal(WORLD_LENGTH_DAYS, 24_107);
  assert.equal(WORLD_LENGTH_MS, 24_107 * 210_000);
  assert.ok(Math.abs(WORLD_LENGTH_MS / 86_400_000 - 58.59) < 0.01);
});
