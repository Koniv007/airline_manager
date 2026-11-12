import test from "node:test";
import assert from "node:assert/strict";
import { AIRCRAFT_DATABASE, getAvailableAircraft, findAircraftById } from "./aircraftData.ts";

test("all aircraft in database have valid positive historical attributes", () => {
  assert.ok(AIRCRAFT_DATABASE.length >= 10);
  for (const ac of AIRCRAFT_DATABASE) {
    assert.ok(ac.id.length > 0, `id missing for ${ac.model}`);
    assert.ok(ac.manufacturer.length > 0);
    assert.ok(ac.model.length > 0);
    assert.ok(ac.passengerCapacityMax > 0);
    assert.ok(ac.rangeKm > 0);
    assert.ok(ac.cruiseSpeedKmh > 0);
    assert.ok(ac.historicalPriceUsd > 0);
    assert.ok(ac.monthlyLeaseRateUsd > 0);
    assert.ok(ac.fuelBurnKgPerHour > 0);
    assert.ok(ac.minRunwayMeters > 0);
    assert.ok(ac.balancing.isEstimatedBalancing === true);
    assert.ok(ac.balancing.cockpitCrew >= 2);
  }
});

test("in 1975 with historical restrictions, only 1975 or earlier aircraft are available", () => {
  const available1975 = getAvailableAircraft(1975, true);
  // Verify expected 1975 aircraft are present
  const ids = available1975.map((a) => a.id);
  assert.ok(ids.includes("b737-200"));
  assert.ok(ids.includes("b727-200"));
  assert.ok(ids.includes("dc-9-30"));
  assert.ok(ids.includes("b747-200b"));
  assert.ok(ids.includes("a300-b4"));
  assert.ok(ids.includes("dhc-6-300"));

  // Verify future aircraft are NOT available in 1975
  assert.ok(!ids.includes("a320-200"));
  assert.ok(!ids.includes("b777-200er"));
  assert.ok(!ids.includes("a380-800"));
  assert.ok(!ids.includes("b787-8"));
  // Concorde introduced in 1976
  assert.ok(!ids.includes("concorde"));

  // Check all available aircraft have introductionYear <= 1975
  for (const ac of available1975) {
    assert.ok(ac.introductionYear <= 1975);
  }
});

test("Concorde unlocks in 1976", () => {
  const available1976 = getAvailableAircraft(1976, true);
  const ids = available1976.map((a) => a.id);
  assert.ok(ids.includes("concorde"));
});

test("in sandbox mode without historical restrictions, all aircraft are available immediately", () => {
  const available = getAvailableAircraft(1975, false);
  assert.equal(available.length, AIRCRAFT_DATABASE.length);
  const ids = available.map((a) => a.id);
  assert.ok(ids.includes("a380-800"));
  assert.ok(ids.includes("b787-8"));
  assert.ok(ids.includes("a350-900"));
});

test("findAircraftById returns the expected aircraft or undefined", () => {
  const b727 = findAircraftById("b727-200");
  assert.ok(b727);
  assert.equal(b727?.manufacturer, "Boeing");
  assert.equal(b727?.historicalPriceUsd, 21_000_000);

  const missing = findAircraftById("non-existent");
  assert.equal(missing, undefined);
});

test("Douglas DC-3 and Tupolev Tu-154B-2 are available in 1975 starting database", () => {
  const dc3 = findAircraftById("dc-3");
  assert.ok(dc3);
  assert.equal(dc3?.manufacturer, "Douglas");
  assert.equal(dc3?.passengerCapacityMax, 32);
  assert.equal(dc3?.productionEndYear, 1945);

  const tu154 = findAircraftById("tu-154b2");
  assert.ok(tu154);
  assert.equal(tu154?.manufacturer, "Tupolev");
  assert.equal(tu154?.passengerCapacityMax, 180);
  assert.equal(tu154?.cruiseSpeedKmh, 900);
  assert.equal(tu154?.balancing.cockpitCrew, 3);
});

test("Boeing 767-300ER and McDonnell Douglas MD-11 are correctly registered in database", () => {
  const b767 = findAircraftById("b767-300er");
  assert.ok(b767);
  assert.equal(b767?.manufacturer, "Boeing");
  assert.equal(b767?.passengerCapacityMax, 290);
  assert.equal(b767?.introductionYear, 1988);

  const md11 = findAircraftById("md-11");
  assert.ok(md11);
  assert.equal(md11?.manufacturer, "McDonnell Douglas");
  assert.equal(md11?.passengerCapacityMax, 410);
  assert.equal(md11?.introductionYear, 1990);
});
