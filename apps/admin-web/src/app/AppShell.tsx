import type { PropsWithChildren } from "react";

import { useAdminSession } from "../core/auth";
import { useAdminRouter } from "../core/router";
import {
  getAllowedRoutes,
  routeLabels,
  type AdminRouteKey
} from "../core/roleAccess";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  activeRoute: AdminRouteKey;
}>;

export function AppShell({
  title,
  subtitle,
  activeRoute,
  children
}: AppShellProps) {
  const { currentUser, signOutSession } = useAdminSession();
  const { navigate } = useAdminRouter();

  if (!currentUser) {
    return null;
  }

  const allowedRoutes = getAllowedRoutes(currentUser.role);
  const rolePill =
    currentUser.role === "super_admin"
      ? "Global access"
      : "School-scoped access";

  return (
    <main className="page-shell">
      <section className="hero hero-expanded">
        <div className="hero-copy">
          <p className="eyebrow">SchoolBus Bridge</p>
          <h1>{title}</h1>
          <p className="lede">{subtitle}</p>
          <div className="role-toggle" aria-label="Admin session controls">
            <button className="resource-danger" onClick={() => void signOutSession()} type="button">
              Sign Out
            </button>
          </div>
        </div>

        <aside className="hero-panel">
          <span className="role-pill">{rolePill}</span>
          <h2>Primary Frontend Surfaces</h2>
          <ul className="stack-list">
            <li>Parent mobile app</li>
            <li>School admin web app</li>
            <li>Super admin web app</li>
          </ul>
          <p className="panel-note">
            Unified admin operations for school-scoped and global roles.
          </p>
        </aside>
      </section>

      <nav className="subnav" aria-label="Admin sections">
        {allowedRoutes.map((route) => (
          <button
            key={route}
            className={route === activeRoute ? "subnav-link active" : "subnav-link"}
            onClick={() => navigate(route)}
            type="button"
          >
            {routeLabels[route]}
          </button>
        ))}
      </nav>

      {children}
    </main>
  );
}
