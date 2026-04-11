import { useEffect, useState, type FormEvent } from "react";

import { useAdminSession } from "../../core/auth";
import { useAdminRouter } from "../../core/router";

export function AdminAuthScreen() {
  const {
    signInWithEmailPassword,
    currentUser,
    authError,
    clearAuthError,
    isLoading
  } = useAdminSession();
  const { navigate } = useAdminRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const canSubmit = email.trim().length > 3 && password.length > 0;

  useEffect(() => {
    if (currentUser) {
      navigate("dashboard");
    }
  }, [currentUser, navigate]);

  async function handleSignIn(event?: FormEvent) {
    event?.preventDefault();
    if (!canSubmit || isLoading) {
      return;
    }
    clearAuthError();
    await signInWithEmailPassword(email.trim(), password);
  }

  return (
    <main className="page-shell auth-layout auth-layout-centered">
      <section className="auth-panel auth-panel-form auth-panel-centered">
        <p className="auth-form-label">Sign In</p>
        <h2>Admin Session Login</h2>
        <p className="panel-summary">
          Use your official admin credentials.
        </p>
        <form className="resource-form one-column" onSubmit={handleSignIn}>
          <label className="auth-input-label" htmlFor="admin-login-email">
            Work Email
          </label>
          <input
            id="admin-login-email"
            className="resource-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.org"
            type="email"
            value={email}
          />
          <label className="auth-input-label" htmlFor="admin-login-password">
            Password
          </label>
          <input
            id="admin-login-password"
            className="resource-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <label className="auth-input-label" htmlFor="admin-login-show-password">
            <input
              id="admin-login-show-password"
              onChange={(event) => setShowPassword(event.target.checked)}
              type="checkbox"
              checked={showPassword}
            />
            {" "}
            Show password
          </label>
          <button
            className="resource-action"
            disabled={isLoading || !canSubmit}
            type="submit"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {authError && <p className="panel-summary error-copy">{authError}</p>}
      </section>
    </main>
  );
}
