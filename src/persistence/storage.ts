import type { KeyValueStorage } from "../auth/authService.ts";

// Uses the browser's local storage; falls back to memory when the browser blocks it.
function pickStorage(): KeyValueStorage {
  try {
    localStorage.setItem("am-test", "1");
    localStorage.removeItem("am-test");
    return localStorage;
  } catch {
    const m = new Map<string, string>();
    return {
      getItem: (k) => m.get(k) ?? null,
      setItem: (k, v) => void m.set(k, v),
      removeItem: (k) => void m.delete(k),
    };
  }
}

/** Local device storage. Guest progress lives only here. */
export const appStorage: KeyValueStorage = pickStorage();
