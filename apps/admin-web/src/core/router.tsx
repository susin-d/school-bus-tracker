import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import type { AdminRouteKey } from "./roleAccess";

const routeMap: Record<string, AdminRouteKey> = {
  "#/": "dashboard",
  "#/live-map": "liveMap",
  "#/schools": "schools",
  "#/users": "users",
  "#/students": "students",
  "#/routes": "routes",
  "#/stops": "stops",
  "#/buses": "buses",
  "#/drivers": "drivers",
  "#/assignments": "assignments",
  "#/mail": "mail",
  "#/alerts": "alerts",
  "#/leaveRequests": "leaveRequests"
};

const reverseRouteMap: Record<AdminRouteKey, string> = {
  dashboard: "#/",
  liveMap: "#/live-map",
  schools: "#/schools",
  users: "#/users",
  students: "#/students",
  routes: "#/routes",
  stops: "#/stops",
  buses: "#/buses",
  drivers: "#/drivers",
  assignments: "#/assignments",
  mail: "#/mail",
  alerts: "#/alerts",
  leaveRequests: "#/leaveRequests"
};

type RouterContextValue = {
  currentRoute: AdminRouteKey;
  navigate: (route: AdminRouteKey) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

function resolveRoute(hash: string): AdminRouteKey {
  return routeMap[hash] ?? "dashboard";
}

export function AdminRouterProvider({ children }: PropsWithChildren) {
  const [currentRoute, setCurrentRoute] = useState<AdminRouteKey>(() =>
    resolveRoute(window.location.hash)
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(resolveRoute(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);

    if (!window.location.hash) {
      window.location.hash = reverseRouteMap.dashboard;
    }

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({
      currentRoute,
      navigate: (route) => {
        window.location.hash = reverseRouteMap[route];
      }
    }),
    [currentRoute]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useAdminRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useAdminRouter must be used within AdminRouterProvider");
  }

  return context;
}
