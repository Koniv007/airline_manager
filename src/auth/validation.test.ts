import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDisplayName, validateEmail, validatePassword } from "./validation.ts";

test("email", () => {
  assert.equal(validateEmail("pilot@example.com"), null);
  assert.notEqual(validateEmail("pilot@"), null);
  assert.notEqual(validateEmail("pilot example.com"), null);
});
test("password needs 8 characters", () => {
  assert.equal(validatePassword("12345678"), null);
  assert.notEqual(validatePassword("1234567"), null);
});
test("display name needs 2-24 characters", () => {
  assert.equal(validateDisplayName("Jan"), null);
  assert.notEqual(validateDisplayName("J"), null);
  assert.notEqual(validateDisplayName("x".repeat(25)), null);
});
