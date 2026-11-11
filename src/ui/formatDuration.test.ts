import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDuration } from "./formatDuration.ts";

test("durations", () => {
  assert.equal(formatDuration(0), "0m");
  assert.equal(formatDuration(90 * 60_000), "1h 30m");
  assert.equal(formatDuration((2 * 1440 + 3 * 60) * 60_000), "2d 3h");
  assert.equal(formatDuration(-5), "0m");
});
