import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthError, LocalAuthService, type KeyValueStorage } from "./authService.ts";

function memory(): KeyValueStorage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

test("sign up creates an account and logs in", async () => {
  const auth = new LocalAuthService(memory());
  const u = await auth.signUp("Pilot@Example.com", "secret123", "Captain Jan");
  assert.equal(u.email, "pilot@example.com");
  assert.equal(auth.getCurrentUser()?.displayName, "Captain Jan");
});
test("the password is not stored in plain text", async () => {
  const s = memory();
  await new LocalAuthService(s).signUp("a@b.cz", "secret123", "Jan");
  assert.ok(!s.getItem("airline-manager-users")!.includes("secret123"));
});
test("duplicate email is rejected", async () => {
  const auth = new LocalAuthService(memory());
  await auth.signUp("a@b.cz", "secret123", "Jan");
  await assert.rejects(auth.signUp("A@B.cz", "another123", "Eva"), AuthError);
});
test("invalid input is rejected", async () => {
  const auth = new LocalAuthService(memory());
  await assert.rejects(auth.signUp("nope", "secret123", "Jan"), AuthError);
  await assert.rejects(auth.signUp("a@b.cz", "short", "Jan"), AuthError);
});
test("sign in works with the right password and fails with a wrong one", async () => {
  const s = memory();
  const auth = new LocalAuthService(s);
  await auth.signUp("a@b.cz", "secret123", "Jan");
  auth.signOut();
  assert.equal(auth.getCurrentUser(), null);
  await assert.rejects(auth.signIn("a@b.cz", "wrong-pass"), AuthError);
  assert.equal((await auth.signIn("a@b.cz", "secret123")).displayName, "Jan");
  assert.notEqual(new LocalAuthService(s).getCurrentUser(), null); // session survives a reload
});
test("Google sign-in is not available offline", async () => {
  await assert.rejects(new LocalAuthService(memory()).signInWithGoogle(), AuthError);
});

// --- Guest mode ---
test("guest can play without an account and is marked as guest", () => {
  const auth = new LocalAuthService(memory());
  const g = auth.playAsGuest();
  assert.equal(g.isGuest, true);
  assert.equal(auth.getCurrentUser()?.id, g.id);
});
test("the guest keeps the same identity after leaving and coming back", () => {
  const s = memory();
  const auth = new LocalAuthService(s);
  const first = auth.playAsGuest();
  auth.signOut();
  assert.equal(auth.getCurrentUser(), null);
  assert.equal(new LocalAuthService(s).playAsGuest().id, first.id);
});
test("registered users are not guests", async () => {
  const u = await new LocalAuthService(memory()).signUp("a@b.cz", "secret123", "Jan");
  assert.equal(u.isGuest, false);
});

// --- Password reset ---
async function withAccount(now: () => number = Date.now) {
  const s = memory();
  const auth = new LocalAuthService(s, now);
  await auth.signUp("a@b.cz", "oldpass123", "Jan");
  auth.signOut();
  return auth;
}
test("password reset: code + new password lets the user log in with the new password", async () => {
  const auth = await withAccount();
  const { demoCode } = await auth.requestPasswordReset("A@b.cz");
  assert.match(demoCode ?? "", /^\d{6}$/);
  await auth.resetPassword("a@b.cz", demoCode!, "newpass456");
  await assert.rejects(auth.signIn("a@b.cz", "oldpass123"), AuthError);
  assert.equal((await auth.signIn("a@b.cz", "newpass456")).displayName, "Jan");
});
test("password reset for an unknown email gives no code and no error", async () => {
  const auth = await withAccount();
  assert.deepEqual(await auth.requestPasswordReset("nobody@b.cz"), {});
});
test("password reset: wrong code is rejected and the old password still works", async () => {
  const auth = await withAccount();
  const { demoCode } = await auth.requestPasswordReset("a@b.cz");
  const wrong = demoCode === "000000" ? "111111" : "000000";
  await assert.rejects(auth.resetPassword("a@b.cz", wrong, "newpass456"), AuthError);
  assert.equal((await auth.signIn("a@b.cz", "oldpass123")).email, "a@b.cz");
});
test("password reset: the code expires after 15 minutes", async () => {
  let t = 1_000_000;
  const auth = await withAccount(() => t);
  const { demoCode } = await auth.requestPasswordReset("a@b.cz");
  t += 15 * 60 * 1000 + 1;
  await assert.rejects(auth.resetPassword("a@b.cz", demoCode!, "newpass456"), AuthError);
});
test("password reset: the code stops working after 5 wrong tries", async () => {
  const auth = await withAccount();
  const { demoCode } = await auth.requestPasswordReset("a@b.cz");
  const wrong = demoCode === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) await assert.rejects(auth.resetPassword("a@b.cz", wrong, "newpass456"), AuthError);
  await assert.rejects(auth.resetPassword("a@b.cz", demoCode!, "newpass456"), AuthError);
});
test("password reset: a code can be used only once and the new password must be valid", async () => {
  const auth = await withAccount();
  const { demoCode } = await auth.requestPasswordReset("a@b.cz");
  await assert.rejects(auth.resetPassword("a@b.cz", demoCode!, "short"), AuthError);
  await auth.resetPassword("a@b.cz", demoCode!, "newpass456");
  await assert.rejects(auth.resetPassword("a@b.cz", demoCode!, "another789"), AuthError);
});
