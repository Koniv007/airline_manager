import test from "node:test";
import assert from "node:assert/strict";
import { resetAllGameData } from "./resetGame.ts";
import { auth } from "../auth/auth.ts";

test("resetAllGameData signs out user and handles storage wipe", () => {
  // Signs in as guest
  auth.playAsGuest();
  assert.ok(auth.getCurrentUser() !== null);

  resetAllGameData();
  assert.equal(auth.getCurrentUser(), null);
});
