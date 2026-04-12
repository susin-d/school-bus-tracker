export type Role = "parent" | "driver" | "admin" | "super_admin";

export type TripStatus =
  | "scheduled"
  | "ready"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "emergency";

export type AttendanceEventType =
  | "boarded"
  | "dropped"
  | "absent"
  | "manual_override";

export type AlertType =
  | "sos"
  | "delay"
  | "geofence"
  | "route_deviation"
  | "speed_anomaly"
  | "attendance_anomaly";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";
export type GeocodeStatus = "pending" | "resolved" | "failed";
export type TripStopStatus =
  | "scheduled"
  | "arrived"
  | "boarded"
  | "dropped"
  | "no_show"
  | "skipped";

export interface School {
  id: string;
  name: string;
  timezone: string;
}

export interface UserProfile {
  id: string;
  schoolId: string;
  role: Role;
  fullName: string;
  phoneE164: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  // Driver specific
  assignedBusId?: string;
  busLabel?: string;
  busPlate?: string;
}


export interface TripSummary {
  id: string;
  schoolId: string;
  routeId?: string;
  busId?: string;
  driverId?: string;
  routeName: string;
  busLabel: string;
  driverName: string;
  status: TripStatus;
  lastUpdatedAt?: string;
  tripKind?: "pickup" | "dropoff" | "special";
  driverPhone?: string;
  driverLicenseNo?: string;
  busCapacity?: number;
  busPlate?: string;
  studentCount?: number;
}

export interface TripLocation {
  latitude: number;
  longitude: number;
  speedKph?: number;
  heading?: number;
  recordedAt: string;
}

export interface StudentSummary {
  id: string;
  fullName: string;
  grade: string;
  assignedBusLabel: string;
  assignedRouteName: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  geocodeStatus?: GeocodeStatus;
}

export interface MobileRoleHomeCard {
  role: Extract<Role, "parent" | "driver">;
  title: string;
  description: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  eventType: AttendanceEventType;
  stopId?: string;
  recordedAt: string;
  recordedByUserId: string;
  notes?: string;
}

export interface AlertRecord {
  id: string;
  schoolId: string;
  tripId?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  triggeredByUserId: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface LeaveRequestRecord {
  id: string;
  studentId: string;
  requestedByParentId: string;
  leaveDate: string;
  tripKind: "pickup" | "dropoff" | "both";
  reason?: string;
  status: LeaveRequestStatus;
  createdAt: string;
}

export interface TripStopManifestItem {
  id: string;
  tripId: string;
  schoolId: string;
  sequence: number;
  studentId?: string;
  studentName?: string;
  stopId?: string;
  latitude: number;
  longitude: number;
  addressText?: string;
  plannedEta?: string;
  currentEta?: string;
  stopStatus: TripStopStatus;
  skipReason?: string;
  actualArrivedAt?: string;
  actualBoardedAt?: string;
  actualDroppedAt?: string;
  noShowAt?: string;
}

export interface RoutePlanVersionSummary {
  id: string;
  schoolId: string;
  tripId: string;
  version: number;
  reason: string;
  routeEngineMode?: "google_waypoint" | "nearest_neighbor_fallback";
  createdByUserId?: string;
  createdAt: string;
}

export interface LiveDriverMapItem {
  tripId: string;
  schoolId: string;
  schoolName?: string;
  driverId?: string;
  driverName?: string;
  busLabel?: string;
  routeName?: string;
  status: TripStatus;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speedKph?: number;
  locationRecordedAt?: string;
  nextStopName?: string;
  nextStopEta?: string;
  etaDelayMinutes?: number;
  isDelayed: boolean;
  clusterKey?: string;
}

export interface SchoolDispatchLocation {
  schoolId: string;
  schoolName?: string;
  latitude: number;
  longitude: number;
}

export interface ParentLiveTrip {
  studentId: string;
  trip: TripSummary | null;
  busLocation: TripLocation | null;
  schoolLocation?: { latitude: number; longitude: number } | null;
  studentStop: TripStopManifestItem | null;
  nextStop: TripStopManifestItem | null;
  estimatedDropoffAt?: string;
  lastUpdatedAt?: string;
}

export interface RealtimeEventEnvelope {
  id: string;
  type:
    | "trip.location.updated"
    | "trip.eta.updated"
    | "trip.stop.status_changed"
    | "trip.reoptimized";
  schoolId: string;
  tripId?: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface NightlyPlannerRun {
  id: string;
  schoolId: string;
  runDate: string;
  triggerType: "manual" | "automatic";
  status: "success" | "failed";
  processedTrips: number;
  plannedTrips: number;
  skippedTrips: number;
  errorCode?: string;
  errorMessage?: string;
  startedAt: string;
  finishedAt: string;
}

export interface SchoolMapSettings {
  schoolId: string;
  dispatchStartTime?: string;
  noShowWaitSeconds: number;
  maxDetourMinutes: number;
  dispatchLatitude?: number;
  dispatchLongitude?: number;
}
