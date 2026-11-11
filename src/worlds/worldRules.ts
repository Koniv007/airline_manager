// The two world types and what is different between them.

export type WorldMode = "career" | "sandbox";

export interface WorldRules {
  readonly mode: WorldMode;
  /** null = unlimited money */
  readonly startingCash: number | null;
  /** true = aircraft become available only in their introduction year */
  readonly historicalRestrictions: boolean;
}

// PLACEHOLDER balancing value, not a historical fact. Will be tuned later.
export const CAREER_STARTING_CASH = 5_000_000;

export function rulesFor(mode: WorldMode): WorldRules {
  return mode === "career"
    ? { mode, startingCash: CAREER_STARTING_CASH, historicalRestrictions: true }
    : { mode, startingCash: null, historicalRestrictions: false };
}

export interface AircraftAvailability {
  readonly introductionYear: number;
}

/** Can the player buy this aircraft new in the given game year? (Used market comes later.) */
export function isAircraftAvailable(
  aircraft: AircraftAvailability,
  gameYear: number,
  rules: WorldRules,
): boolean {
  if (!rules.historicalRestrictions) return true;
  return aircraft.introductionYear <= gameYear;
}
