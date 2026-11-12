import type { HistoricalAircraft } from "../aircraft/types.ts";
import { findAircraftById } from "../aircraft/aircraftData.ts";
import type { PlayerAircraft, SeatConfiguration } from "./types.ts";
import {
  generateRegistration,
  createDefaultConfiguration,
  generateRandomLeaseConfiguration,
  calculateUsedAircraftStats,
} from "./types.ts";
import type { GameState } from "../game/gameStore.ts";
import { toGameDate } from "../simulation/gameClock.ts";

export interface TransactionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly newState?: GameState;
}

export interface BuyAircraftOptions {
  readonly customRegistration?: string;
  readonly nickname?: string;
  readonly isUsed?: boolean;
  readonly seatConfig?: SeatConfiguration;
}

/** Computes the fair resale value for an owned aircraft */
export function calculateResaleValue(aircraft: PlayerAircraft): number {
  if (aircraft.ownership !== "purchased") return 0;
  // Depreciated value based on current condition and market discount (80%)
  return Math.round(aircraft.purchasePriceUsd * (aircraft.conditionPct / 100) * 0.8);
}

/** Computes total resale value of all owned aircraft in the fleet */
export function calculateFleetValue(fleet: readonly PlayerAircraft[]): number {
  return fleet.reduce((sum, a) => sum + calculateResaleValue(a), 0);
}

/** Validates that a custom seat configuration does not exceed aircraft space limit */
export function isSeatConfigValid(config: SeatConfiguration, maxCapacity: number): boolean {
  if (config.economySeats < 0 || config.businessSeats < 0 || config.firstSeats < 0) return false;
  const spaceUsed = config.economySeats + (config.businessSeats * 2) + (config.firstSeats * 3);
  return spaceUsed <= maxCapacity;
}

/** Buy an aircraft (brand new from factory or pre-owned from used market) */
export function buyAircraftAction(
  state: GameState,
  modelId: string,
  options?: BuyAircraftOptions,
): TransactionResult {
  const model = findAircraftById(modelId);
  if (!model) {
    return { success: false, message: `Aircraft with ID "${modelId}" was not found.` };
  }

  const isCareer = state.mode === "career";
  const gameDate = toGameDate(state.clock);

  // Check historical introduction availability
  if (isCareer && model.introductionYear > gameDate.year) {
    return {
      success: false,
      message: `${model.manufacturer} ${model.model} will become available in ${model.introductionYear}.`,
    };
  }

  // Check if production has ended (if production ended, brand new is not allowed)
  const isOutOfProduction = isCareer && model.productionEndYear < gameDate.year;
  const isBuyingUsed = options?.isUsed || isOutOfProduction;

  if (isOutOfProduction && !options?.isUsed) {
    return {
      success: false,
      message: `Production of ${model.model} ended in ${model.productionEndYear}. It can only be purchased on the used aircraft market.`,
    };
  }

  // Calculate pricing, condition and age
  let price = model.historicalPriceUsd;
  let conditionPct = 100;
  let flightHours = 0;
  let ageYears = 0;

  if (isBuyingUsed) {
    const usedStats = calculateUsedAircraftStats(model.historicalPriceUsd, model.introductionYear, gameDate.year);
    price = usedStats.priceUsd;
    conditionPct = usedStats.conditionPct;
    flightHours = usedStats.flightHours;
    ageYears = usedStats.ageYears;
  }

  // Check funds
  if (Number.isFinite(state.cash) && state.cash < price) {
    return {
      success: false,
      message: `Insufficient funds. Purchase price is $${price.toLocaleString("en-US")}, but your balance is $${state.cash.toLocaleString("en-US")}.`,
    };
  }

  // Seat configuration (customizable during purchase)
  let seatConfig: SeatConfiguration;
  if (options?.seatConfig && isSeatConfigValid(options.seatConfig, model.passengerCapacityMax)) {
    seatConfig = options.seatConfig;
  } else {
    seatConfig = createDefaultConfiguration(model.passengerCapacityMax);
  }

  const registration = options?.customRegistration?.trim() || generateRegistration(state.fleet);
  if (state.fleet.some((a) => a.registration.toUpperCase() === registration.toUpperCase())) {
    return { success: false, message: `Registration "${registration}" already exists in your fleet.` };
  }

  const newAircraft: PlayerAircraft = {
    id: `ac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    modelId: model.id,
    manufacturer: model.manufacturer,
    model: model.model,
    category: model.category,
    registration: registration.toUpperCase(),
    nickname: options?.nickname?.trim() || undefined,
    ownership: "purchased",
    isUsed: isBuyingUsed,
    ageYears,
    seatConfiguration: seatConfig,
    purchasePriceUsd: price,
    monthlyLeaseUsd: model.monthlyLeaseRateUsd,
    conditionPct,
    flightHours,
    passengerCapacity: seatConfig.totalSeats,
    maxCapacity: model.passengerCapacityMax,
    cargoCapacityKg: model.cargoCapacityKg,
    rangeKm: model.rangeKm,
    cruiseSpeedKmh: model.cruiseSpeedKmh,
    fuelBurnKgPerHour: model.fuelBurnKgPerHour,
    cockpitCrew: model.balancing.cockpitCrew,
    cabinCrew: model.balancing.cabinCrew,
    acquiredDate: `${gameDate.day}. ${gameDate.month}. ${gameDate.year}`,
    status: "idle",
  };

  const nextCash = Number.isFinite(state.cash) ? state.cash - price : Infinity;
  const nextFleet = [...state.fleet, newAircraft];

  return {
    success: true,
    message: isBuyingUsed
      ? `Successfully purchased pre-owned aircraft (${ageYears} yrs old): ${model.manufacturer} ${model.model} (${registration}).`
      : `Successfully purchased brand new aircraft from factory: ${model.manufacturer} ${model.model} (${registration}).`,
    newState: {
      ...state,
      cash: nextCash,
      fleet: nextFleet,
    },
  };
}

/** Lease an aircraft on operational lease with random cabin configuration */
export function leaseAircraftAction(
  state: GameState,
  modelId: string,
  options?: { customRegistration?: string; nickname?: string },
): TransactionResult {
  const model = findAircraftById(modelId);
  if (!model) {
    return { success: false, message: `Aircraft with ID "${modelId}" was not found.` };
  }

  const isCareer = state.mode === "career";
  const gameDate = toGameDate(state.clock);
  if (isCareer && model.introductionYear > gameDate.year) {
    return {
      success: false,
      message: `${model.manufacturer} ${model.model} will be available for lease in ${model.introductionYear}.`,
    };
  }

  // Initial deposit / upfront lease fee (1st month)
  const deposit = model.monthlyLeaseRateUsd;
  if (Number.isFinite(state.cash) && state.cash < deposit) {
    return {
      success: false,
      message: `Insufficient funds for initial lease deposit ($${deposit.toLocaleString("en-US")}).`,
    };
  }

  const registration = options?.customRegistration?.trim() || generateRegistration(state.fleet);
  if (state.fleet.some((a) => a.registration.toUpperCase() === registration.toUpperCase())) {
    return { success: false, message: `Registration "${registration}" already exists in your fleet.` };
  }

  // Leased aircraft come with random configuration pre-installed by the lessor
  const seatConfig = generateRandomLeaseConfiguration(model.passengerCapacityMax);

  const newAircraft: PlayerAircraft = {
    id: `ac_lease_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    modelId: model.id,
    manufacturer: model.manufacturer,
    model: model.model,
    category: model.category,
    registration: registration.toUpperCase(),
    nickname: options?.nickname?.trim() || undefined,
    ownership: "leased",
    isUsed: false,
    ageYears: 0,
    seatConfiguration: seatConfig,
    purchasePriceUsd: model.historicalPriceUsd,
    monthlyLeaseUsd: model.monthlyLeaseRateUsd,
    conditionPct: 100,
    flightHours: 0,
    passengerCapacity: seatConfig.totalSeats,
    maxCapacity: model.passengerCapacityMax,
    cargoCapacityKg: model.cargoCapacityKg,
    rangeKm: model.rangeKm,
    cruiseSpeedKmh: model.cruiseSpeedKmh,
    fuelBurnKgPerHour: model.fuelBurnKgPerHour,
    cockpitCrew: model.balancing.cockpitCrew,
    cabinCrew: model.balancing.cabinCrew,
    acquiredDate: `${gameDate.day}. ${gameDate.month}. ${gameDate.year}`,
    status: "idle",
  };

  const nextCash = Number.isFinite(state.cash) ? state.cash - deposit : Infinity;
  const nextFleet = [...state.fleet, newAircraft];

  return {
    success: true,
    message: `Successfully leased ${model.manufacturer} ${model.model} (${registration}).`,
    newState: {
      ...state,
      cash: nextCash,
      fleet: nextFleet,
    },
  };
}

/** Sell an owned aircraft back to the market */
export function sellAircraftAction(state: GameState, aircraftId: string): TransactionResult {
  const target = state.fleet.find((a) => a.id === aircraftId);
  if (!target) {
    return { success: false, message: "Aircraft was not found in your fleet." };
  }
  if (target.ownership !== "purchased") {
    return { success: false, message: "Leased aircraft cannot be sold — use lease termination instead." };
  }

  const resaleValue = calculateResaleValue(target);
  const nextCash = Number.isFinite(state.cash) ? state.cash + resaleValue : Infinity;
  const nextFleet = state.fleet.filter((a) => a.id !== aircraftId);

  return {
    success: true,
    message: `Aircraft ${target.registration} was sold for $${resaleValue.toLocaleString("en-US")}.`,
    newState: {
      ...state,
      cash: nextCash,
      fleet: nextFleet,
    },
  };
}

/** Return an operational leased aircraft back to lessor */
export function returnLeasedAircraftAction(state: GameState, aircraftId: string): TransactionResult {
  const target = state.fleet.find((a) => a.id === aircraftId);
  if (!target) {
    return { success: false, message: "Aircraft was not found in your fleet." };
  }
  if (target.ownership !== "leased") {
    return { success: false, message: "Owned aircraft cannot be returned from lease — use sell instead." };
  }

  const nextFleet = state.fleet.filter((a) => a.id !== aircraftId);

  return {
    success: true,
    message: `Lease for aircraft ${target.registration} was terminated and returned to the lessor.`,
    newState: {
      ...state,
      fleet: nextFleet,
    },
  };
}
