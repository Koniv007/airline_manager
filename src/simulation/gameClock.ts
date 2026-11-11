// Pure game-time logic. No React, no browser APIs -> easy to test.
// The game never pauses: the date is calculated from the real clock.

export const MIN_YEAR = 1975;
export const MAX_YEAR = 2040;

/** Pace of the world: 1 game day = 3.5 real minutes (same for everyone). */
export const REAL_SECONDS_PER_GAME_DAY = 210;
const REAL_MS_PER_GAME_DAY = REAL_SECONDS_PER_GAME_DAY * 1000;

/** Time is stored as a whole number of days since 1 Jan 1970 (UTC). */
export interface GameClock {
  readonly epochDay: number;
}

export interface GameDate {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
}

const MS_PER_DAY = 86_400_000;
const LAST_EPOCH_DAY = Math.floor(Date.UTC(MAX_YEAR, 11, 31) / MS_PER_DAY);

function assertStartYear(year: number): void {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`Start year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
  }
}

export function createClock(year: number = MIN_YEAR, month = 1, day = 1): GameClock {
  assertStartYear(year);
  return { epochDay: Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY) };
}

export function advanceDays(clock: GameClock, days: number): GameClock {
  if (!Number.isInteger(days) || days < 0) {
    throw new RangeError("Days must be a non-negative integer");
  }
  return { epochDay: clock.epochDay + days };
}

/**
 * The game date at real time `nowMs`, for a world that was created at `worldStartMs`
 * (both in milliseconds, like Date.now()). The result stops at 31 Dec 2040.
 * In multiplayer, `worldStartMs` will come from the server.
 */
export function clockAt(
  worldStartMs: number,
  nowMs: number,
  startYear: number = MIN_YEAR,
): GameClock {
  assertStartYear(startYear);
  const elapsedMs = Math.max(0, nowMs - worldStartMs);
  const days = Math.floor(elapsedMs / REAL_MS_PER_GAME_DAY);
  const epochDay = createClock(startYear).epochDay + days;
  return { epochDay: Math.min(epochDay, LAST_EPOCH_DAY) };
}

/** True once the world has reached its last day (31 Dec 2040). */
export function isWorldOver(clock: GameClock): boolean {
  return clock.epochDay >= LAST_EPOCH_DAY;
}

export function toGameDate(clock: GameClock): GameDate {
  const d = new Date(clock.epochDay * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function formatDate(clock: GameClock): string {
  const { year, month, day } = toGameDate(clock);
  return `${day}. ${month}. ${year}`;
}

/** The game ends after 31 Dec of MAX_YEAR. */
export function isGameFinished(clock: GameClock): boolean {
  return toGameDate(clock).year > MAX_YEAR;
}

// ---- Time of day (hours and minutes) ----
// A game day has 24 game hours. 1 game day = 210 real seconds, so
// 1 game hour = 8.75 real seconds and 1 game minute ≈ 0.146 real seconds.

export interface TimeOfDay {
  readonly hour: number; // 0-23
  readonly minute: number; // 0-59
  readonly secondsToNextDay: number; // real seconds until the date changes
}

export function timeOfDay(
  worldStartMs: number,
  nowMs: number,
  startYear: number = MIN_YEAR,
): TimeOfDay {
  if (isWorldOver(clockAt(worldStartMs, nowMs, startYear))) {
    return { hour: 0, minute: 0, secondsToNextDay: 0 };
  }
  const elapsedMs = Math.max(0, Math.floor(nowMs - worldStartMs));
  const msIntoDay = elapsedMs % REAL_MS_PER_GAME_DAY;
  const totalMinutes = Math.floor((msIntoDay * 1440) / REAL_MS_PER_GAME_DAY);
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
    secondsToNextDay: Math.ceil((REAL_MS_PER_GAME_DAY - msIntoDay) / 1000),
  };
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type DayPhase = "night" | "dawn" | "day" | "dusk";

export function dayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

/** How far the world has come, from 0 (start) to 1 (31 Dec 2040). */
export function worldProgress(clock: GameClock, startYear: number = MIN_YEAR): number {
  const start = createClock(startYear).epochDay;
  const span = LAST_EPOCH_DAY - start;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (clock.epochDay - start) / span));
}

// ---- Length of one world (season) ----
// A world runs from 1 Jan 1975 to 31 Dec 2040. The last day is shown for one game day, then a new season starts.
export const WORLD_LENGTH_DAYS = LAST_EPOCH_DAY - createClock(MIN_YEAR).epochDay + 1;
export const WORLD_LENGTH_MS = WORLD_LENGTH_DAYS * REAL_MS_PER_GAME_DAY;
