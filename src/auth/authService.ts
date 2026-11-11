// Account handling behind one interface.
// LocalAuthService is for TESTING ONLY: accounts live in this browser and are NOT secure.
// When the game goes online, a SupabaseAuthService (email + Google + real password reset email)
// replaces it. The screens do not change.
import { validateDisplayName, validateEmail, validatePassword } from "./validation.ts";

export interface User {
  readonly id: string;
  readonly email: string; // empty for guests
  readonly displayName: string;
  readonly isGuest: boolean;
}

export class AuthError extends Error {}

export interface PasswordResetRequest {
  /** Only the local test version returns the code, because it cannot send email. */
  readonly demoCode?: string;
}

export interface AuthService {
  getCurrentUser(): User | null;
  signUp(email: string, password: string, displayName: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  /** Guest progress is saved only on this device. */
  playAsGuest(): User;
  requestPasswordReset(email: string): Promise<PasswordResetRequest>;
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;
  signOut(): void;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly salt: string;
  readonly hash: string;
}

interface ResetRecord {
  readonly code: string;
  readonly expiresAt: number;
  readonly attempts: number;
}

const USERS_KEY = "airline-manager-users";
const SESSION_KEY = "airline-manager-session"; // an email, or "guest"
const GUEST_ID_KEY = "airline-manager-guest-id";
const RESETS_KEY = "airline-manager-resets";
const GUEST_SESSION = "guest";
export const RESET_CODE_TTL_MS = 15 * 60 * 1000;
export const RESET_MAX_ATTEMPTS = 5;
const RESET_ERROR = "Invalid or expired code";

function randomHex(bytes: number): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readJson<T>(storage: KeyValueStorage, key: string): Record<string, T> {
  try {
    return JSON.parse(storage.getItem(key) ?? "{}") as Record<string, T>;
  } catch {
    return {};
  }
}

export class LocalAuthService implements AuthService {
  private readonly storage: KeyValueStorage;
  private readonly now: () => number;

  constructor(storage: KeyValueStorage, now: () => number = Date.now) {
    this.storage = storage;
    this.now = now;
  }

  private publicUser(u: StoredUser): User {
    return { id: u.id, email: u.email, displayName: u.displayName, isGuest: false };
  }

  private guestUser(): User | null {
    const id = this.storage.getItem(GUEST_ID_KEY);
    return id ? { id, email: "", displayName: "Guest", isGuest: true } : null;
  }

  getCurrentUser(): User | null {
    const session = this.storage.getItem(SESSION_KEY);
    if (!session) return null;
    if (session === GUEST_SESSION) return this.guestUser();
    const u = readJson<StoredUser>(this.storage, USERS_KEY)[session];
    return u ? this.publicUser(u) : null;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const problem =
      validateEmail(email) ?? validatePassword(password) ?? validateDisplayName(displayName);
    if (problem) throw new AuthError(problem);
    const key = email.trim().toLowerCase();
    const users = readJson<StoredUser>(this.storage, USERS_KEY);
    if (users[key]) throw new AuthError("An account with this email already exists");
    const salt = randomHex(16);
    const user: StoredUser = {
      id: `u_${randomHex(8)}`,
      email: key,
      displayName: displayName.trim(),
      salt,
      hash: await hashPassword(password, salt),
    };
    users[key] = user;
    this.storage.setItem(USERS_KEY, JSON.stringify(users));
    this.storage.setItem(SESSION_KEY, key);
    return this.publicUser(user);
  }

  async signIn(email: string, password: string): Promise<User> {
    const key = email.trim().toLowerCase();
    const user = readJson<StoredUser>(this.storage, USERS_KEY)[key];
    if (!user || (await hashPassword(password, user.salt)) !== user.hash) {
      throw new AuthError("Wrong email or password");
    }
    this.storage.setItem(SESSION_KEY, key);
    return this.publicUser(user);
  }

  async signInWithGoogle(): Promise<User> {
    throw new AuthError("Google sign-in will be available when the game goes online");
  }

  playAsGuest(): User {
    if (!this.storage.getItem(GUEST_ID_KEY)) {
      this.storage.setItem(GUEST_ID_KEY, `g_${randomHex(8)}`);
    }
    this.storage.setItem(SESSION_KEY, GUEST_SESSION);
    return this.guestUser()!;
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequest> {
    const problem = validateEmail(email);
    if (problem) throw new AuthError(problem);
    const key = email.trim().toLowerCase();
    // Same answer whether or not the account exists (the online version must not reveal this).
    if (!readJson<StoredUser>(this.storage, USERS_KEY)[key]) return {};
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    const resets = readJson<ResetRecord>(this.storage, RESETS_KEY);
    resets[key] = { code, expiresAt: this.now() + RESET_CODE_TTL_MS, attempts: 0 };
    this.storage.setItem(RESETS_KEY, JSON.stringify(resets));
    return { demoCode: code };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const problem = validatePassword(newPassword);
    if (problem) throw new AuthError(problem);
    const key = email.trim().toLowerCase();
    const resets = readJson<ResetRecord>(this.storage, RESETS_KEY);
    const record = resets[key];
    const users = readJson<StoredUser>(this.storage, USERS_KEY);
    const user = users[key];
    if (!record || !user || this.now() > record.expiresAt || record.attempts >= RESET_MAX_ATTEMPTS) {
      delete resets[key];
      this.storage.setItem(RESETS_KEY, JSON.stringify(resets));
      throw new AuthError(RESET_ERROR);
    }
    if (record.code !== code.trim()) {
      resets[key] = { ...record, attempts: record.attempts + 1 };
      this.storage.setItem(RESETS_KEY, JSON.stringify(resets));
      throw new AuthError(RESET_ERROR);
    }
    const salt = randomHex(16);
    users[key] = { ...user, salt, hash: await hashPassword(newPassword, salt) };
    delete resets[key];
    this.storage.setItem(USERS_KEY, JSON.stringify(users));
    this.storage.setItem(RESETS_KEY, JSON.stringify(resets));
  }

  signOut(): void {
    this.storage.removeItem(SESSION_KEY);
  }
}
