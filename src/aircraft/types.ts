export type AircraftCategory = "turboprop" | "regional" | "narrowbody" | "widebody" | "jumbo" | "supersonic";

export interface HistoricalAircraft {
  readonly id: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly category: AircraftCategory;

  // Timeline
  readonly firstFlightYear: number;
  readonly introductionYear: number;
  readonly productionEndYear: number;

  // Performance specifications (verified historical data)
  readonly passengerCapacityMax: number;
  readonly passengerCapacityTypical2Class: number;
  readonly cargoCapacityKg: number;
  readonly rangeKm: number;
  readonly cruiseSpeedKmh: number;
  readonly minRunwayMeters: number;

  // Economy (historical era pricing & fuel burn)
  /** Historical purchase price in USD at introduction / mid-1970s nominal value */
  readonly historicalPriceUsd: number;
  /** Estimated hourly dry lease rate in USD (game-balancing parameter) */
  readonly monthlyLeaseRateUsd: number;
  /** Average cruise fuel consumption in kg/hour */
  readonly fuelBurnKgPerHour: number;

  // Operational balancing metrics (clearly separated as game estimates)
  readonly balancing: {
    /** Minimum turnaround time in minutes at gate */
    readonly turnaroundMinutes: number;
    /** Flight crew (pilots + flight engineers if 3-crew cockpit in 1975) */
    readonly cockpitCrew: number;
    /** Cabin crew required per typical passenger configuration */
    readonly cabinCrew: number;
    /** Estimated base maintenance cost in USD per flight hour (in 1975 USD baseline) */
    readonly maintenanceCostPerHourUsd: number;
    /** Whether any non-historical estimates were applied */
    readonly isEstimatedBalancing: true;
  };
}
