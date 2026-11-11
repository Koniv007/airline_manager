// Saved airline per player and per server.
// Now: stored on this device (the only option for guests).
// Later: accounts save to the online database, guests stay local.
import type { KeyValueStorage } from "../auth/authService.ts";

export interface SavedAirline {
  readonly airlineName: string;
  readonly cash: number; // Infinity = unlimited (sandbox)
}

interface StoredShape {
  version: 1;
  airlineName: string;
  cash: number | null; // JSON cannot hold Infinity, so null means unlimited
}

export function saveKey(userId: string, serverId: string): string {
  return `airline-manager-save:${userId}:${serverId}`;
}

export function writeSave(storage: KeyValueStorage, userId: string, serverId: string, save: SavedAirline): void {
  const data: StoredShape = {
    version: 1,
    airlineName: save.airlineName,
    cash: Number.isFinite(save.cash) ? save.cash : null,
  };
  try {
    storage.setItem(saveKey(userId, serverId), JSON.stringify(data));
  } catch {
    /* storage full or blocked: the game keeps running without saving */
  }
}

export function loadSave(storage: KeyValueStorage, userId: string, serverId: string): SavedAirline | null {
  try {
    const raw = storage.getItem(saveKey(userId, serverId));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<StoredShape>;
    if (d.version !== 1 || typeof d.airlineName !== "string") return null;
    if (d.cash !== null && typeof d.cash !== "number") return null;
    return { airlineName: d.airlineName, cash: d.cash === null ? Infinity : d.cash };
  } catch {
    return null;
  }
}

// Who has an airline on which world (on this device). The online version counts this on the server.
function membersKey(worldKey: string): string {
  return `airline-manager-members:${worldKey}`;
}

function readMembers(storage: KeyValueStorage, worldKey: string): string[] {
  try {
    const v = JSON.parse(storage.getItem(membersKey(worldKey)) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function registerMember(storage: KeyValueStorage, worldKey: string, userId: string): void {
  const members = readMembers(storage, worldKey);
  if (members.includes(userId)) return;
  try {
    storage.setItem(membersKey(worldKey), JSON.stringify([...members, userId]));
  } catch {
    /* ignore */
  }
}

export function memberCount(storage: KeyValueStorage, worldKey: string): number {
  return readMembers(storage, worldKey).length;
}
