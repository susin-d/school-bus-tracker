import type { FormEvent, PropsWithChildren } from "react";
import { useMemo, useState } from "react";

import { useAdminSession } from "../core/auth";
import { useAdminRouter } from "../core/router";
import {
  getAllowedRoutes,
  routeLabels,
  type AdminRouteKey
} from "../core/roleAccess";

type NavGroup = {
  label: string;
  routes: AdminRouteKey[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    routes: ["dashboard", "liveMap"]
  },
  {
    label: "Operations",
    routes: ["students", "users", "drivers", "buses", "routes", "stops", "assignments"]
  },
  {
    label: "Communications",
    routes: ["alerts", "leaveRequests", "mail"]
  },
  {
    label: "Administration",
    routes: ["schools"]
  }
];

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  activeRoute: AdminRouteKey;
  hideHeader?: boolean;
}>;

export function AppShell({
  title,
  subtitle,
  activeRoute,
  hideHeader = true,
  children
}: AppShellProps) {
  const { currentUser, signOutSession } = useAdminSession();
  const { navigate } = useAdminRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const allowedRoutes = currentUser ? getAllowedRoutes(currentUser.role) : [];
  const breadcrumbLabel = routeLabels[activeRoute];
  const breadcrumbGroup = getBreadcrumbGroup(activeRoute);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          routes: group.routes.filter(
            (route) =>
              allowedRoutes.includes(route) &&
              routeLabels[route].toLowerCase().includes(normalizedQuery)
          )
        }))
        .filter((group) => group.routes.length > 0),
    [allowedRoutes, normalizedQuery]
  );

  if (!currentUser) {
    return null;
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstMatch = filteredGroups[0]?.routes[0];
    if (firstMatch) {
      navigate(firstMatch);
      setSidebarOpen(false);
    }
  }

  return (
    <main className="page-shell app-layout">
      <div
        className={sidebarOpen ? "app-sidebar-backdrop visible" : "app-sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={sidebarOpen ? "app-sidebar open" : "app-sidebar"} aria-label="Admin navigation">
        <div className="app-sidebar-brand">
          <div>
            <p className="eyebrow">SchoolBus Bridge</p>
            <h2 className="app-sidebar-title">Admin Console</h2>
          </div>
        </div>

        <div className="app-sidebar-profile panel-surface">
          <strong>{currentUser.label}</strong>
          <span>{currentUser.role === "super_admin" ? "Global access" : "School-scoped access"}</span>
          {currentUser.schoolId && <span>School ID: {currentUser.schoolId}</span>}
        </div>

        <form className="app-search" onSubmit={handleSearchSubmit} role="search">
          <label className="sr-only" htmlFor="admin-shell-search">
            Search navigation
          </label>
          <input
            id="admin-shell-search"
            className="resource-input"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search pages"
            value={searchQuery}
          />
        </form>

        <nav className="app-sidebar-nav" aria-label="Admin sections">
          {filteredGroups.map((group) => (
            <section className="app-nav-group" key={group.label} aria-label={group.label}>
              <p className="app-nav-group-label">{group.label}</p>
              <div className="app-nav-group-items">
                {group.routes.map((route) => (
                  <button
                    key={route}
                    className={route === activeRoute ? "app-sidebar-link active" : "app-sidebar-link"}
                    onClick={() => {
                      navigate(route);
                      setSidebarOpen(false);
                    }}
                    type="button"
                  >
                    {routeLabels[route]}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <button className="resource-danger app-sidebar-signout" onClick={() => void signOutSession()} type="button">
          Sign Out
        </button>
      </aside>

      <section className="app-content">
        {hideHeader && (
          <button className="app-sidebar-toggle" onClick={() => setSidebarOpen(true)} type="button">
            Menu
          </button>
        )}
        {!hideHeader && (
          <header className="app-content-header">
            <div className="app-topbar">
              <button className="app-sidebar-toggle" onClick={() => setSidebarOpen(true)} type="button">
                Menu
              </button>
              <div className="app-topbar-actions">
                <button className="subnav-link" onClick={() => navigate("liveMap")} type="button">
                  Live Map
                </button>
                <button className="resource-action" onClick={() => navigate("alerts")} type="button">
                  Alerts
                </button>
              </div>
            </div>

            <nav className="app-breadcrumbs" aria-label="Breadcrumb">
              <button className="app-breadcrumb-link" onClick={() => navigate("dashboard")} type="button">
                Dashboard
              </button>
              <span aria-hidden="true">/</span>
              <span>{breadcrumbGroup}</span>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{breadcrumbLabel}</span>
            </nav>

            <div className="app-content-copy">
              <div>
                <p className="eyebrow">{breadcrumbGroup}</p>
                <h1>{title}</h1>
              </div>
              <p className="lede">{subtitle}</p>
            </div>
          </header>
        )}
        <div className="app-page-sections">
          {children}
        </div>
      </section>
    </main>
  );
}

function getBreadcrumbGroup(route: AdminRouteKey) {
  switch (route) {
    case "dashboard":
    case "liveMap":
      return "Overview";
    case "alerts":
    case "leaveRequests":
    case "mail":
      return "Communications";
    case "schools":
      return "Administration";
    default:
      return "Operations";
  }
}
