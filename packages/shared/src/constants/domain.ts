import type { AlertType, AttendanceEventType, Role, TripStatus } from "../types/domain.js";

export const roleLabels: Role[] = ["parent", "driver", "admin", "super_admin"];

export const tripStatusLabels: TripStatus[] = [
  "scheduled",
  "ready",
  "active",
  "paused",
  "completed",
  "cancelled",
  "emergency"
];

export const attendanceEventTypeLabels: AttendanceEventType[] = [
  "boarded",
  "dropped",
  "absent",
  "manual_override"
];

export const alertTypeLabels: AlertType[] = [
  "sos",
  "delay",
  "geofence",
  "route_deviation",
  "speed_anomaly",
  "attendance_anomaly"
];
