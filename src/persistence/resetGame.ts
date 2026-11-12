import { appStorage } from "./storage.ts";
import { leaveWorld } from "../game/gameStore.ts";
import { auth } from "../auth/auth.ts";

/**
 * Resets all saved data, active worlds, airlines, and local sessions.
 * Intended for debugging and full game state wiping.
 */
export function resetAllGameData(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  } catch (e) {
    console.warn("Could not clear localStorage:", e);
  }

  // Clear all keys from appStorage fallback if needed
  try {
    // Also sign out current user
    auth.signOut();
  } catch (e) {
    // Ignore
  }

  // Leave active world state
  try {
    leaveWorld();
  } catch (e) {
    // Ignore
  }
}
