import type { AircraftCategory } from "../aircraft/types.ts";

export type OwnershipType = "purchased" | "leased";

export interface SeatConfiguration {
  readonly economySeats: number;
  readonly businessSeats: number;
  readonly firstSeats: number;
  readonly totalSeats: number;
}

export interface PlayerAircraft {
  readonly id: string; // Unique instance id, e.g. "ac_1700000000000_1"
  readonly modelId: string; // References HistoricalAircraft.id
  readonly manufacturer: string;
  readonly model: string;
  readonly category: AircraftCategory;
  readonly registration: string; // Tail registration, e.g. "N101AM"
  readonly nickname?: string; // Optional custom name
  readonly ownership: OwnershipType;
  readonly isUsed: boolean;
  readonly ageYears: number; // 0 for brand new, >0 for used
  readonly seatConfiguration: SeatConfiguration;
  readonly purchasePriceUsd: number;
  readonly monthlyLeaseUsd: number;
  readonly conditionPct: number; // 0 - 100
  readonly flightHours: number;
  readonly passengerCapacity: number; // total configured seats
  readonly maxCapacity: number; // theoretical maximum capacity
  readonly cargoCapacityKg: number;
  readonly rangeKm: number;
  readonly cruiseSpeedKmh: number;
  readonly fuelBurnKgPerHour: number;
  readonly cockpitCrew: number;
  readonly cabinCrew: number;
  readonly acquiredDate: string; // Game date string, e.g. "1 Jan 1975"
  readonly status: "idle" | "in_flight" | "maintenance";
}

/** Generates a default all-economy configuration */
export function createDefaultConfiguration(maxCapacity: number): SeatConfiguration {
  return {
    economySeats: maxCapacity,
    businessSeats: 0,
    firstSeats: 0,
    totalSeats: maxCapacity,
  };
}

/** Generates random seat configuration for leased aircraft (determined by lessor) */
export function generateRandomLeaseConfiguration(maxCapacity: number): SeatConfiguration {
  if (maxCapacity <= 25) {
    return createDefaultConfiguration(maxCapacity);
  }

  const roll = Math.random();
  if (roll < 0.35) {
    // All-Economy layout
    return createDefaultConfiguration(maxCapacity);
  } else if (roll < 0.8) {
    // Standard 2-Class (Economy + Business)
    const bizSeats = Math.max(4, Math.floor((maxCapacity * 0.12) / 2) * 2);
    const ecoSeats = Math.max(0, maxCapacity - bizSeats * 2);
    return {
      economySeats: ecoSeats,
      businessSeats: bizSeats,
      firstSeats: 0,
      totalSeats: ecoSeats + bizSeats,
    };
  } else {
    // 3-Class Layout (Economy + Business + First)
    const firstSeats = Math.max(2, Math.floor((maxCapacity * 0.04) / 2) * 2);
    const bizSeats = Math.max(4, Math.floor((maxCapacity * 0.10) / 2) * 2);
    const ecoSeats = Math.max(0, maxCapacity - (firstSeats * 3) - (bizSeats * 2));
    return {
      economySeats: ecoSeats,
      businessSeats: bizSeats,
      firstSeats,
      totalSeats: ecoSeats + bizSeats + firstSeats,
    };
  }
}

export interface UsedAircraftStats {
  readonly isUsed: boolean;
  readonly ageYears: number;
  readonly conditionPct: number;
  readonly flightHours: number;
  readonly priceUsd: number;
}

/**
 * Calculates market statistics for used aircraft.
 * When aircraft is out of production or bought on the used market,
 * it costs significantly less than brand new and has pre-existing hours and condition.
 */
export function calculateUsedAircraftStats(
  historicalPriceUsd: number,
  introductionYear: number,
  currentYear: number,
): UsedAircraftStats {
  const yearsSinceIntro = Math.max(1, currentYear - introductionYear);
  const ageYears = Math.min(22, Math.max(3, Math.floor(yearsSinceIntro * 0.75)));
  const conditionPct = Math.max(68, Math.min(88, 100 - Math.round(ageYears * 1.8)));
  const flightHours = Math.round(ageYears * 2200);
  const discountFactor = Math.max(0.38, Math.min(0.70, (conditionPct / 100) * (1 - ageYears * 0.022)));
  const priceUsd = Math.round(historicalPriceUsd * discountFactor);

  return {
    isUsed: true,
    ageYears,
    conditionPct,
    flightHours,
    priceUsd,
  };
}

/** Generates a plausible default tail registration */
export function generateRegistration(existing: readonly PlayerAircraft[], prefix = "N"): string {
  const existingSet = new Set(existing.map((a) => a.registration));
  for (let num = 101; num <= 999; num++) {
    const candidate = `${prefix}${num}AM`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  return `${prefix}${Date.now().toString().slice(-4)}AM`;
}
