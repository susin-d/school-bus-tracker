import type {
  AlertRecord,
  AlertType,
  AttendanceRecord,
  AttendanceEventType,
  GeocodeStatus,
  LiveDriverMapItem,
  SchoolDispatchLocation,
  NightlyPlannerRun,
  LeaveRequestRecord,
  ParentLiveTrip,
  RealtimeEventEnvelope,
  Role,
  SchoolMapSettings,
  StudentSummary,
  TripStopManifestItem,
  TripLocation,
  TripStatus,
  TripSummary,
  UserProfile
} from "./domain.js";

export interface BootstrapResponse {
  roles: string[];
  tripStatuses: TripStatus[];
  attendanceEventTypes: AttendanceEventType[];
  alertTypes: AlertType[];
}

export interface AuthSessionResponse {
  token: string;
  user: UserProfile;
}

export interface CreateStreamTokenRequest {
  schoolId?: string;
  tripId?: string;
}

export interface StreamTokenResponse {
  streamToken: string;
  expiresAt: string;
}

export interface CreateSessionRequest {
  accessToken?: string;
  idToken?: string;
}

export interface CurrentTripResponse {
  trip: TripSummary | null;
  students?: StudentSummary[];
  lastLocation?: TripLocation | null;
}

export interface TripLocationResponse {
  tripId: string;
  status?: TripStatus;
  location: TripLocation | null;
}

export interface AttendanceListResponse {
  tripId: string;
  records: AttendanceRecord[];
}

export interface AttendanceEventRequest {
  studentId: string;
  eventType: AttendanceEventType;
  stopId?: string;
  notes?: string;
}

export interface UpdateTripStatusRequest {
  status: Extract<TripStatus, "ready" | "active" | "paused" | "completed" | "cancelled">;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface MobileLoginOption {
  role: Extract<Role, "parent" | "driver">;
  fullName: string;
  subtitle: string;
}

export interface AlertListResponse {
  alerts: AlertRecord[];
}

export interface CreateAlertRequest {
  tripId?: string;
  type: AlertType;
  severity?: "low" | "medium" | "high" | "critical";
  message: string;
}

export interface ResolveAlertRequest {
  resolutionNote?: string;
}

export interface LeaveRequestInput {
  studentId: string;
  leaveDate: string;
  tripKind: "pickup" | "dropoff" | "both";
  reason?: string;
}

export interface LeaveRequestListResponse {
  requests: LeaveRequestRecord[];
}

export interface StudentGeocodeResponse {
  studentId: string;
  geocodeStatus: GeocodeStatus;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  formattedAddress?: string;
  error?: string;
}

export interface BulkGeocodeResponse {
  schoolId: string;
  totalStudents: number;
  successCount: number;
  failureCount: number;
  results: StudentGeocodeResponse[];
}

export interface OptimizeDailyRoutesResponse {
  schoolId: string;
  processedTrips: number;
  plannedTrips: number;
  skippedTrips: number;
  tripIds: string[];
  routeEngineMode: "google_waypoint" | "nearest_neighbor_fallback";
}

export interface TripManifestResponse {
  tripId: string;
  routeVersion?: number;
  generatedAt?: string;
  stops: TripStopManifestItem[];
}

export interface TripReoptimizeResponse {
  tripId: string;
  hasPlan: boolean;
  stopCount: number;
  routeVersion: number;
  routeEngineMode: "google_waypoint" | "nearest_neighbor_fallback";
}

export interface StopActionResponse {
  ok: true;
  tripId: string;
  stopId: string;
  stopStatus: TripStopManifestItem["stopStatus"];
  reoptimized: boolean;
}

export interface DriversLiveMapResponse {
  drivers: LiveDriverMapItem[];
}

export interface SchoolDispatchLocationsResponse {
  schools: SchoolDispatchLocation[];
}

export interface ParentLiveTripResponse {
  liveTrip: ParentLiveTrip;
}

export interface RealtimeEventsResponse {
  events: RealtimeEventEnvelope[];
}

export interface NightlyPlannerRunsResponse {
  runs: NightlyPlannerRun[];
}

export interface SchoolMapSettingsResponse {
  settings: SchoolMapSettings;
}

export interface UpdateSchoolMapSettingsRequest {
  dispatchStartTime?: string;
  noShowWaitSeconds?: number;
  maxDetourMinutes?: number;
  dispatchLatitude?: number;
  dispatchLongitude?: number;
}
