import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map as MapIcon, 
  Users, 
  Bus, 
  School, 
  Route, 
  MapPin, 
  Bell, 
  Mail, 
  ClipboardList, 
  LogOut,
  Menu,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { useAdminSession } from "../core/auth";
import { useAdminRouter } from "../core/router";
import {
  getAllowedRoutes,
  routeLabels,
  type AdminRouteKey
} from "../core/roleAccess";

type NavGroup = {
  label: string;
  routes: Array<{ key: AdminRouteKey; icon: typeof LayoutDashboard }>;
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    routes: [
      { key: "dashboard", icon: LayoutDashboard },
      { key: "liveMap", icon: MapIcon }
    ]
  },
  {
    label: "Operations",
    routes: [
      { key: "students", icon: Users },
      { key: "users", icon: Users },
      { key: "drivers", icon: Users },
      { key: "buses", icon: Bus },
      { key: "routes", icon: Route }
    ]
  },
  {
    label: "Communications",
    routes: [
      { key: "alerts", icon: Bell },
      { key: "leaveRequests", icon: ClipboardList },
      { key: "mail", icon: Mail }
    ]
  },
  {
    label: "Administration",
    routes: [
      { key: "schools", icon: School }
    ]
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const allowedRoutes = currentUser ? getAllowedRoutes(currentUser.role) : [];
  const breadcrumbLabel = routeLabels[activeRoute];
  const breadcrumbGroup = getBreadcrumbGroup(activeRoute);

  const filteredGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          routes: group.routes.filter((route) => allowedRoutes.includes(route.key))
        }))
        .filter((group) => group.routes.length > 0),
    [allowedRoutes]
  );

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!currentUser) {
    return null;
  }

  return (
    <main className={`app-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="app-sidebar-backdrop visible"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={`app-sidebar glass-surface ${sidebarOpen ? "open" : ""} ${isSidebarCollapsed ? "collapsed" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="app-sidebar-brand">
          <p className="app-sidebar-mark" aria-hidden="true">SB</p>
          <button
            className="app-sidebar-collapse"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            type="button"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="sr-only">{isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </button>
        </div>

        <nav className="app-sidebar-nav" aria-label="Admin sections">
          {filteredGroups.map((group) => (
            <section className="app-nav-group" key={group.label} aria-label={group.label}>
              <p className={`app-nav-group-label ${isSidebarCollapsed ? "sr-only" : ""}`}>{group.label}</p>
              <div className="app-nav-group-items">
                {group.routes.map((route) => (
                  <button
                    key={route.key}
                    className={`app-sidebar-link ${route.key === activeRoute ? "active" : ""} ${isSidebarCollapsed ? "collapsed" : ""}`}
                    aria-label={routeLabels[route.key]}
                    title={isSidebarCollapsed ? routeLabels[route.key] : undefined}
                    onClick={() => {
                      navigate(route.key);
                      setSidebarOpen(false);
                    }}
                    type="button"
                  >
                    <route.icon className={isSidebarCollapsed ? "w-4 h-4 opacity-80" : "w-4 h-4 mr-3 opacity-80"} />
                    {isSidebarCollapsed ? <span className="sr-only">{routeLabels[route.key]}</span> : routeLabels[route.key]}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <button 
          className={`app-sidebar-signout ${isSidebarCollapsed ? "collapsed" : ""}`}
          onClick={() => void signOutSession()} 
          title="Sign out"
          aria-label="Sign out"
          type="button"
        >
          <LogOut className={isSidebarCollapsed ? "w-4 h-4" : "w-4 h-4 mr-2"} />
          {isSidebarCollapsed ? <span className="sr-only">Sign Out</span> : "Sign Out"}
        </button>
      </aside>

      <section className="app-content">
        <header className={`app-content-header glass-surface ${hideHeader ? "p-4 !flex-row !justify-between !items-center" : ""}`}>
          <div className="flex items-center gap-4">
            <button
              className="app-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            {!hideHeader && (
              <nav className="app-breadcrumbs" aria-label="Breadcrumb">
                <button className="app-breadcrumb-link" onClick={() => navigate("dashboard")} type="button">
                  Dashboard
                </button>
                <span className="opacity-40" aria-hidden="true">/</span>
                <span>{breadcrumbGroup}</span>
                <span className="opacity-40" aria-hidden="true">/</span>
                <span className="text-slate-900 font-bold" aria-current="page">{breadcrumbLabel}</span>
              </nav>
            )}
            {hideHeader && (
              <div className="flex items-center gap-2">
                {isSidebarCollapsed && (
                  <button
                    className="app-sidebar-inline-expand"
                    onClick={() => setIsSidebarCollapsed(false)}
                    type="button"
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <p className="eyebrow !m-0">{breadcrumbGroup}</p>
                <h1 className="text-xl font-bold !m-0">{title}</h1>
              </div>
            )}
          </div>

          {!hideHeader && (
            <div className="app-content-copy mt-4">
              <div>
                <p className="eyebrow">{breadcrumbGroup}</p>
                <h1>{title}</h1>
              </div>
              <p className="lede">{subtitle}</p>
            </div>
          )}

          <div className="app-topbar-actions flex gap-2">
            <button className="resource-action subtle" onClick={() => navigate("liveMap")} type="button">
              <MapIcon className="w-4 h-4" />
              Live Map
            </button>
            <button className="resource-action !bg-slate-900 !text-white" onClick={() => navigate("alerts")} type="button">
              <Bell className="w-4 h-4" />
              Alerts
            </button>
          </div>
        </header>

        <motion.div 
          key={activeRoute}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="app-page-sections flex flex-col gap-6 w-full"
        >
          {children}
        </motion.div>
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
