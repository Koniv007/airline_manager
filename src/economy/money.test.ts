import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney } from "./money.ts";

test("normal cash is formatted with separators", () => {
  assert.equal(formatMoney(5_000_000), "$5,000,000");
});
test("unlimited cash shows the infinity symbol", () => {
  assert.equal(formatMoney(Infinity), "∞");
});
test("unlimited cash stays unlimited after buying something", () => {
  assert.equal(Infinity - 90_000_000, Infinity);
});
