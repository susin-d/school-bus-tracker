import { useState } from "react";

import { useAdminSession } from "../../core/auth";

export function AdminAuthScreen() {
  const {
    signInWithEmailPassword,
    authError,
    clearAuthError,
    isLoading
  } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignIn() {
    clearAuthError();
    await signInWithEmailPassword(email.trim(), password);
  }

  return (
    <main className="page-shell">
      <section className="resource-panel">
        <h1>Admin Session Sign-in</h1>
        <p className="panel-summary">
          Sign in with email/password through backend auth. Account must map to an `admin` or `super_admin` profile.
        </p>
        <div className="resource-form one-column">
          <input
            className="resource-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            value={email}
          />
          <input
            className="resource-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            value={password}
          />
          <button
            className="resource-action"
            disabled={isLoading}
            onClick={handleSignIn}
            type="button"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        {authError && <p className="panel-summary error-copy">{authError}</p>}
      </section>
    </main>
  );
}
