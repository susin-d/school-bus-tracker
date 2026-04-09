import { useAdminRouter } from "../../core/router";

export function AdminLandingPage() {
  const { navigate } = useAdminRouter();

  return (
    <main className="page-shell">
      <section className="landing-shell">
        <header className="landing-topbar">
          <p className="eyebrow">SchoolBus Bridge</p>
          <div className="landing-actions">
            <button className="subnav-link" onClick={() => navigate("login")} type="button">
              Login
            </button>
            <button className="resource-action" onClick={() => navigate("login")} type="button">
              Sign Up
            </button>
          </div>
        </header>

        <article className="hero-copy">
          <h1>School Transportation Admin</h1>
          <p className="lede">
            Manage routes, drivers, students, and alerts from one admin console. Use Login or Sign Up to continue.
          </p>
        </article>
      </section>
    </main>
  );
}
