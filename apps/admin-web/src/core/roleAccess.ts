import type { Role } from "@school-bus/shared";

export type AdminRouteKey =
  | "dashboard"
  | "liveMap"
  | "schools"
  | "users"
  | "students"
  | "routes"
  | "stops"
  | "buses"
  | "drivers"
  | "assignments"
  | "mail"
  | "alerts"
  | "leaveRequests";

export type AdminPreviewUser = {
  id: string;
  label: string;
  role: Extract<Role, "admin" | "super_admin">;
  schoolId?: string;
};

export type AdminRequestUser = {
  id: string;
  label: string;
  role: Extract<Role, "admin" | "super_admin">;
  schoolId?: string;
  accessToken?: string;
  mode: "preview" | "session";
};

export const previewUsers: AdminPreviewUser[] = [
  {
    id: "admin-1",
    label: "Greenfield School Admin",
    role: "admin",
    schoolId: "school-1"
  },
  {
    id: "super-1",
    label: "Platform Super Admin",
    role: "super_admin"
  }
];

export const routeLabels: Record<AdminRouteKey, string> = {
  dashboard: "Dashboard",
  liveMap: "Live Map",
  schools: "Schools",
  users: "Users",
  students: "Students",
  routes: "Routes",
  stops: "Stops",
  buses: "Buses",
  drivers: "Drivers",
  assignments: "Assignments",
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
    "stops",
    "buses",
    "drivers",
    "assignments",
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
    "stops",
    "buses",
    "drivers",
    "assignments",
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
