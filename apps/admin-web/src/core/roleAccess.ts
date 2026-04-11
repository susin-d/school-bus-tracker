import type { Role } from "@school-bus/shared";

export type AdminRouteKey =
  | "landing"
  | "login"
  | "dashboard"
  | "liveMap"
  | "schools"
  | "users"
  | "students"
  | "routes"
  | "buses"
  | "drivers"
  | "mail"
  | "alerts"
  | "leaveRequests";

export type AdminRequestUser = {
  id: string;
  label: string;
  role: Extract<Role, "admin" | "super_admin">;
  schoolId?: string;
  accessToken?: string;
};

export const routeLabels: Record<AdminRouteKey, string> = {
  landing: "Landing",
  login: "Login",
  dashboard: "Dashboard",
  liveMap: "Live Map",
  schools: "Schools",
  users: "Users",
  students: "Students",
  routes: "Routes",
  buses: "Buses",
  drivers: "Drivers",
  mail: "Mail",
  alerts: "Alerts",
  leaveRequests: "Leave Requests"
};

const routeAccess: Record<Extract<Role, "admin" | "super_admin">, AdminRouteKey[]> = {
  admin: [
    "dashboard",
    "liveMap",
    "users",
    "students",
    "routes",
    "buses",
    "drivers",
    "mail",
    "alerts",
    "leaveRequests"
  ],
  super_admin: [
    "dashboard",
    "liveMap",
    "schools",
    "users",
    "students",
    "routes",
    "buses",
    "drivers",
    "mail",
    "alerts",
    "leaveRequests"
  ]
};

export function getAllowedRoutes(role: Extract<Role, "admin" | "super_admin">) {
  return routeAccess[role];
}

export function canAccessRoute(
  role: Extract<Role, "admin" | "super_admin">,
  route: AdminRouteKey
) {
  return getAllowedRoutes(role).includes(route);
}
