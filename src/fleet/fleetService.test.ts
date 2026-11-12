import test from "node:test";
import assert from "node:assert/strict";
import { createWorldState, type GameState, type Player } from "../game/gameStore.ts";
import { serversFor } from "../worlds/serverList.ts";
import {
  buyAircraftAction,
  leaseAircraftAction,
  sellAircraftAction,
  returnLeasedAircraftAction,
  calculateFleetValue,
} from "./fleetService.ts";

const testPlayer: Player = { id: "p1", displayName: "Tester", isGuest: false };

function createTestState(mode: "career" | "sandbox" = "career", cashOverride?: number): GameState {
  const server = serversFor(mode, Date.now())[0];
  // Using worldStartMs ensures the test clock begins on 1 Jan 1975
  const base = createWorldState(server, testPlayer, server.worldStartMs);
  return {
    ...base,
    cash: cashOverride !== undefined ? cashOverride : base.cash,
    fleet: [],
  };
}

test("career mode: can buy 1975 aircraft if player has enough money", () => {
  // Give player $20,000,000 cash (enough for a $16,000,000 B737-200)
  const initial = createTestState("career", 20_000_000);
  const result = buyAircraftAction(initial, "b737-200", { customRegistration: "N737AA", nickname: "Eagle 1" });

  assert.equal(result.success, true);
  assert.ok(result.newState);
  assert.equal(result.newState.cash, 20_000_000 - 16_000_000);
  assert.equal(result.newState.fleet.length, 1);

  const plane = result.newState.fleet[0];
  assert.equal(plane.registration, "N737AA");
  assert.equal(plane.nickname, "Eagle 1");
  assert.equal(plane.ownership, "purchased");
  assert.equal(plane.conditionPct, 100);
  assert.equal(plane.model, "737-200 Advanced");
});

test("career mode: rejects purchase when player has insufficient cash", () => {
  // $10,000,000 is not enough for a $21,000,000 B727-200
  const initial = createTestState("career", 10_000_000);
  const result = buyAircraftAction(initial, "b727-200");

  assert.equal(result.success, false);
  assert.match(result.message || "", /Insufficient funds/);
  assert.equal(result.newState, undefined);
});

test("career mode: rejects aircraft from future introduction year", () => {
  // In 1975, A320-200 (1988) cannot be purchased
  const initial = createTestState("career", 100_000_000);
  const result = buyAircraftAction(initial, "a320-200");

  assert.equal(result.success, false);
  assert.match(result.message || "", /will become available in 1988/);
});

test("sandbox mode: allows purchasing any aircraft even from future years with infinite cash", () => {
  const initial = createTestState("sandbox");
  const result = buyAircraftAction(initial, "a380-800");

  assert.equal(result.success, true);
  assert.ok(result.newState);
  assert.equal(result.newState.cash, Infinity);
  assert.equal(result.newState.fleet.length, 1);
});

test("lease aircraft: requires only monthly deposit, registers ownership as leased", () => {
  const initial = createTestState("career", 5_000_000);
  // A300B4 monthly lease is $380,000
  const result = leaseAircraftAction(initial, "a300-b4");

  assert.equal(result.success, true);
  assert.ok(result.newState);
  assert.equal(result.newState.cash, 5_000_000 - 380_000);
  assert.equal(result.newState.fleet.length, 1);

  const plane = result.newState.fleet[0];
  assert.equal(plane.ownership, "leased");
  assert.equal(plane.monthlyLeaseUsd, 380_000);
});

test("selling owned aircraft adds fair resale value to cash and removes from fleet", () => {
  const initial = createTestState("career", 20_000_000);
  const buyRes = buyAircraftAction(initial, "b737-200");
  assert.ok(buyRes.newState);

  const planeId = buyRes.newState.fleet[0].id;
  const cashBeforeSale = buyRes.newState.cash;

  const sellRes = sellAircraftAction(buyRes.newState, planeId);
  assert.equal(sellRes.success, true);
  assert.ok(sellRes.newState);
  assert.equal(sellRes.newState.fleet.length, 0);

  // Resale of $16,000,000 at 100% condition * 0.8 = $12,800,000
  const expectedResale = Math.round(16_000_000 * 0.8);
  assert.equal(sellRes.newState.cash, cashBeforeSale + expectedResale);
});

test("returning leased aircraft terminates lease without resale credit", () => {
  const initial = createTestState("career", 5_000_000);
  const leaseRes = leaseAircraftAction(initial, "a300-b4");
  assert.ok(leaseRes.newState);

  const planeId = leaseRes.newState.fleet[0].id;
  const cashBeforeReturn = leaseRes.newState.cash;

  const returnRes = returnLeasedAircraftAction(leaseRes.newState, planeId);
  assert.equal(returnRes.success, true);
  assert.ok(returnRes.newState);
  assert.equal(returnRes.newState.fleet.length, 0);
  assert.equal(returnRes.newState.cash, cashBeforeReturn); // Cash unchanged upon return
});

test("calculateFleetValue returns correct sum for owned aircraft only", () => {
  const initial = createTestState("career", 50_000_000);
  const buy1 = buyAircraftAction(initial, "b737-200");
  const buy2 = buyAircraftAction(buy1.newState!, "b727-200");
  const lease1 = leaseAircraftAction(buy2.newState!, "a300-b4");

  const fleet = lease1.newState!.fleet;
  assert.equal(fleet.length, 3);

  const value = calculateFleetValue(fleet);
  const expected = Math.round(16_000_000 * 0.8) + Math.round(21_000_000 * 0.8);
  assert.equal(value, expected);
});

test("buying used aircraft costs significantly less and has realistic hours and condition", () => {
  const initial = createTestState("career", 20_000_000);
  const result = buyAircraftAction(initial, "b737-200", { isUsed: true });

  assert.equal(result.success, true);
  assert.ok(result.newState);
  const plane = result.newState.fleet[0];
  assert.equal(plane.isUsed, true);
  assert.ok(plane.ageYears > 0);
  assert.ok(plane.conditionPct < 100 && plane.conditionPct > 60);
  assert.ok(plane.flightHours > 5000);
  // Used price should be lower than the $16,000,000 brand new price
  assert.ok(plane.purchasePriceUsd < 16_000_000);
  // Cash remaining is more than buying new
  assert.ok(result.newState.cash > 20_000_000 - 16_000_000);
});

test("custom seat configuration applies properly on purchase", () => {
  const initial = createTestState("career", 20_000_000);
  // B737-200 max capacity is 130
  // Custom config: 100 Eco + 12 Business (uses 100 + 24 = 124 space <= 130)
  const customConfig = {
    economySeats: 100,
    businessSeats: 12,
    firstSeats: 0,
    totalSeats: 112,
  };
  const result = buyAircraftAction(initial, "b737-200", { seatConfig: customConfig });

  assert.equal(result.success, true);
  assert.ok(result.newState);
  const plane = result.newState.fleet[0];
  assert.equal(plane.seatConfiguration.economySeats, 100);
  assert.equal(plane.seatConfiguration.businessSeats, 12);
  assert.equal(plane.seatConfiguration.firstSeats, 0);
  assert.equal(plane.passengerCapacity, 112);
  assert.equal(plane.maxCapacity, 130);
});

test("leasing generates a random cabin configuration", () => {
  const initial = createTestState("career", 5_000_000);
  const result = leaseAircraftAction(initial, "b737-200");

  assert.equal(result.success, true);
  assert.ok(result.newState);
  const plane = result.newState.fleet[0];
  assert.ok(plane.seatConfiguration);
  assert.ok(plane.seatConfiguration.totalSeats > 0);
  assert.ok(plane.passengerCapacity <= 130);
  assert.equal(plane.maxCapacity, 130);
});

