import { useState, type FormEvent } from "react";
import { auth } from "../../auth/auth.ts";
import { AuthError, type User } from "../../auth/authService.ts";
import Backdrop from "../Backdrop.tsx";

type View = "login" | "register" | "forgot" | "reset";

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  function go(v: View) {
    setView(v);
    setError("");
    setInfo("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (view === "login") {
        onAuthenticated(await auth.signIn(email, password));
      } else if (view === "register") {
        onAuthenticated(await auth.signUp(email, password, displayName));
      } else if (view === "forgot") {
        const r = await auth.requestPasswordReset(email);
        setDemoCode(r.demoCode ?? null);
        setCode("");
        setPassword("");
        setView("reset");
        setInfo("If an account with this email exists, a reset code has been sent.");
      } else {
        await auth.resetPassword(email, code, password);
        setPassword("");
        setCode("");
        setView("login");
        setInfo("Password changed. You can log in now.");
      }
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong, please try again");
    } finally {
      setBusy(false);
    }
  }

  const recovering = view === "forgot" || view === "reset";
  const submitLabel = { login: "Log in", register: "Create account", forgot: "Send reset code", reset: "Set new password" }[view];

  return (
    <div className="screen">
      <Backdrop />
      <div className="panel narrow">
        <div className="brand big-brand"><span className="logo">✈</span> Airline Manager</div>
        <p className="tagline">1975 – 2040 · build the greatest airline in the world</p>

        {recovering ? (
          <h2 className="subtitle">Reset password</h2>
        ) : (
          <div className="tabs">
            <button className={view === "login" ? "on" : ""} onClick={() => go("login")}>Log in</button>
            <button className={view === "register" ? "on" : ""} onClick={() => go("register")}>Create account</button>
          </div>
        )}

        <form onSubmit={submit}>
          {view === "register" && (
            <label className="field">Your name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="nickname" />
            </label>
          )}
          <label className="field">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" readOnly={view === "reset"} />
          </label>
          {view === "reset" && demoCode && (
            <div className="demo-code">Test version: no email can be sent. Your code is <b>{demoCode}</b></div>
          )}
          {view === "reset" && (
            <label className="field">6-digit code
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" />
            </label>
          )}
          {view !== "forgot" && (
            <label className="field">{view === "reset" ? "New password" : "Password"}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={view === "login" ? "current-password" : "new-password"} />
            </label>
          )}
          {info && <p className="info" role="status">{info}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" type="submit" disabled={busy}>{submitLabel}</button>
        </form>

        {view === "login" && <button className="link" onClick={() => go("forgot")}>Forgot password?</button>}
        {recovering && <button className="link" onClick={() => go("login")}>← Back to log in</button>}

        {!recovering && (
          <>
            <div className="divider"><span>or</span></div>
            <button className="google" disabled title="Available when the game goes online">
              <span className="g">G</span> Continue with Google <small>online soon</small>
            </button>
            <button className="secondary guest" onClick={() => onAuthenticated(auth.playAsGuest())}>
              Play as guest <small>saved on this device only</small>
            </button>
          </>
        )}
        <p className="fine">Test version: accounts are stored only in this browser.</p>
      </div>
    </div>
  );
}
