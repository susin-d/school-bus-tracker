import { useAdminRouter } from "../../core/router";

export function AdminLandingPage() {
  const { navigate } = useAdminRouter();

  return (
    <main className="landing-page">
      <header className="landing-nav-wrap">
        <nav className="landing-nav page-shell">
          <a className="landing-brand" href="#top">
            SchoolBus Bridge
          </a>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="landing-actions">
            <button className="subnav-link" onClick={() => navigate("login")} type="button">
              Login
            </button>
            <button className="resource-action" onClick={() => navigate("login")} type="button">
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      <section className="page-shell landing-shell" id="top">
        <section className="landing-hero">
          <article className="hero-copy">
            <p className="eyebrow">SchoolBus Bridge</p>
            <h1>Manage School Transport in One Smart Command Center</h1>
            <p className="lede">
              Live maps, route planning, student visibility, and instant alerts for school admins and super admins.
            </p>
            <div className="landing-hero-actions">
              <button className="resource-action" onClick={() => navigate("login")} type="button">
                Start Free
              </button>
              <a className="subnav-link" href="#product-preview">
                View Demo
              </a>
            </div>
            <p className="landing-hero-note">No setup hassle. Role-based access. Real-time updates.</p>
          </article>

          <aside className="landing-mockup">
            <div className="landing-mockup-window">
              <p className="landing-window-title">Live Operations Snapshot</p>
              <div className="landing-window-grid">
                <article>
                  <span>Active Trips</span>
                  <strong>42</strong>
                </article>
                <article>
                  <span>On-time</span>
                  <strong>95%</strong>
                </article>
                <article>
                  <span>Open Alerts</span>
                  <strong>3</strong>
                </article>
                <article>
                  <span>Drivers Online</span>
                  <strong>28</strong>
                </article>
              </div>
            </div>
          </aside>
        </section>

        <section className="landing-section">
          <p className="eyebrow">Trusted By Teams</p>
          <div className="landing-logo-row">
            <span>NORTHRIDGE DISTRICT</span>
            <span>GREENFIELD SCHOOL</span>
            <span>CITY EDU BOARD</span>
            <span>KIDSAFE TRANSIT</span>
            <span>BRIGHTSTAR ACADEMY</span>
          </div>
          <div className="landing-testimonials">
            <article className="panel">
              <p>
                "Our dispatch calls dropped by 40% after switching. We can see delays and act before parents call."
              </p>
              <strong>Priya Nair</strong>
              <span>Transport Coordinator</span>
            </article>
            <article className="panel">
              <p>
                "One dashboard for all schools gave our district team the visibility we were missing."
              </p>
              <strong>Arun Mehta</strong>
              <span>Operations Lead</span>
            </article>
            <article className="panel">
              <p>
                "Route edits and alert workflows are fast and clear. Training new admins takes minutes."
              </p>
              <strong>Neha Singh</strong>
              <span>School Admin</span>
            </article>
          </div>
        </section>

        <section className="landing-section" id="features">
          <p className="eyebrow">Features</p>
          <h2>Everything Needed for Daily Transport Operations</h2>
          <div className="landing-feature-grid">
            <FeatureCard icon="LM" title="Live Map Control" text="Track drivers and routes in real time with event streaming." />
            <FeatureCard icon="RP" title="Route Planning" text="Optimize assignments and dispatch plans with fewer manual steps." />
            <FeatureCard icon="ST" title="Student Management" text="Maintain profiles, addresses, and stop assignments in one place." />
            <FeatureCard icon="AL" title="Alert Workflows" text="Acknowledge and resolve incidents quickly with clear audit trails." />
            <FeatureCard icon="RL" title="Role Access" text="School admins and super admins get the right visibility by default." />
            <FeatureCard icon="ML" title="Mass Mail" text="Notify students, users, or custom lists directly from the dashboard." />
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <p className="eyebrow">How It Works</p>
          <div className="landing-steps">
            <article className="panel">
              <span className="landing-step-number">1</span>
              <h3>Connect Your Schools</h3>
              <p>Add schools, users, routes, and buses in a guided setup.</p>
            </article>
            <article className="panel">
              <span className="landing-step-number">2</span>
              <h3>Run Daily Operations</h3>
              <p>Monitor trips, resolve alerts, and adjust plans as conditions change.</p>
            </article>
            <article className="panel">
              <span className="landing-step-number">3</span>
              <h3>Improve Every Week</h3>
              <p>Use performance insights to reduce delays and increase on-time arrivals.</p>
            </article>
          </div>
        </section>

        <section className="landing-section" id="product-preview">
          <p className="eyebrow">Product Preview</p>
          <div className="landing-preview-grid">
            <article className="panel">
              <h3>Operations Dashboard</h3>
              <p>Core KPIs for active trips, unresolved alerts, and student onboard trends.</p>
            </article>
            <article className="panel">
              <h3>Real-Time Driver Feed</h3>
              <p>Stream location updates, status changes, and incident events in one view.</p>
            </article>
            <article className="panel">
              <h3>Resource Management</h3>
              <p>CRUD modules for schools, users, students, routes, stops, and assignments.</p>
            </article>
          </div>
        </section>

        <section className="landing-section" id="pricing">
          <p className="eyebrow">Pricing</p>
          <div className="landing-pricing-grid">
            <article className="panel">
              <h3>Starter</h3>
              <p className="landing-price">$0</p>
              <ul className="stack-list">
                <li>Single school dashboard</li>
                <li>Core route and student modules</li>
                <li>Email support</li>
              </ul>
            </article>
            <article className="panel landing-plan-highlight">
              <p className="landing-plan-badge">Recommended</p>
              <h3>Pro</h3>
              <p className="landing-price">$49<span>/month</span></p>
              <ul className="stack-list">
                <li>Multi-school management</li>
                <li>Live map and alert workflows</li>
                <li>Priority support</li>
              </ul>
            </article>
            <article className="panel">
              <h3>Enterprise</h3>
              <p className="landing-price">Custom</p>
              <ul className="stack-list">
                <li>District-wide rollout</li>
                <li>Advanced governance controls</li>
                <li>Dedicated success manager</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="landing-cta panel">
          <h2>Bring Clarity to Every School Route</h2>
          <p>Get started today and give your operations team one reliable control center.</p>
          <form className="landing-capture" onSubmit={(event) => event.preventDefault()}>
            <input className="resource-input" placeholder="Work email" type="email" />
            <button className="resource-action" type="button" onClick={() => navigate("login")}>
              Get Started
            </button>
          </form>
        </section>

        <footer className="landing-footer">
          <div className="landing-footer-links">
            <a href="#top">About</a>
            <a href="#top">Contact</a>
            <a href="#top">Privacy</a>
          </div>
          <div className="landing-footer-social">
            <a href="#top" aria-label="x">
              X
            </a>
            <a href="#top" aria-label="linkedin">
              IN
            </a>
            <a href="#top" aria-label="youtube">
              YT
            </a>
          </div>
          <p>© {new Date().getFullYear()} SchoolBus Bridge. All rights reserved.</p>
        </footer>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <article className="panel landing-feature-card">
      <span className="landing-feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
