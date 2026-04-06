import type {
  BulkGeocodeResponse,
  LiveDriverMapItem,
  ParentLiveTrip,
  SchoolMapSettings,
  StudentGeocodeResponse,
  TripManifestResponse,
  TripStopManifestItem,
  UserProfile
} from "@school-bus/shared";

import { HttpError } from "./http.js";
import {
  addSeconds,
  estimateTravelSeconds,
  geocodeAddress,
  isValidLatLng,
  optimizeWaypointOrder,
  type LatLng
} from "./maps.js";
import { publishRealtimeEvent } from "./realtime.js";
import {
  assertUserCanAccessStudent,
  assertUserCanAccessTrip,
  createAttendanceRecord,
  getTripLocation
} from "./data.js";
import { getSupabaseAdminClient } from "./supabase.js";

type RecordMap = Record<string, unknown>;
type TripStopAction = "arrived" | "boarded" | "no_show";

type InternalTripStop = {
  id?: string;
  schoolId: string;
  tripId: string;
  studentId?: string;
  stopId?: string;
  studentName?: string;
  addressText?: string;
  latitude: number;
  longitude: number;
  sequence: number;
  plannedEta?: string;
  currentEta?: string;
  stopStatus: TripStopManifestItem["stopStatus"];
  skipReason?: string;
  actualArrivedAt?: string;
  actualBoardedAt?: string;
  actualDroppedAt?: string;
  noShowAt?: string;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function asIso(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function mapTripStop(row: RecordMap): TripStopManifestItem {
  return {
    id: asString(row.id),
    tripId: asString(row.trip_id),
    schoolId: asString(row.school_id),
    sequence: asNumber(row.sequence) ?? 0,
    studentId: asString(row.student_id) || undefined,
    studentName: asString(row.student_name) || undefined,
    stopId: asString(row.stop_id) || undefined,
    latitude: asNumber(row.latitude) ?? 0,
    longitude: asNumber(row.longitude) ?? 0,
    addressText: asString(row.address_text) || undefined,
    plannedEta: asIso(row.planned_eta),
    currentEta: asIso(row.current_eta),
    stopStatus: (row.stop_status as TripStopManifestItem["stopStatus"]) ?? "scheduled",
    skipReason: asString(row.skip_reason) || undefined,
    actualArrivedAt: asIso(row.actual_arrived_at),
    actualBoardedAt: asIso(row.actual_boarded_at),
    actualDroppedAt: asIso(row.actual_dropped_at),
    noShowAt: asIso(row.no_show_at)
  };
}

function requireRoleForSchoolMutation(user: UserProfile, schoolId: string) {
  if (user.role === "super_admin") {
    return;
  }

  if (user.role !== "admin" || user.schoolId !== schoolId) {
    throw new HttpError(403, "You cannot manage this school", "school_access_forbidden");
  }
}

function isCompletedStatus(status: TripStopManifestItem["stopStatus"]) {
  return status === "boarded" || status === "dropped" || status === "no_show" || status === "skipped";
}

async function selectSchoolMapSettings(schoolId: string): Promise<SchoolMapSettings> {
  const { data, error } = await getSupabaseAdminClient()
    .from("school_map_settings")
    .select("*")
    .eq("school_id", schoolId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message, "school_map_settings_fetch_failed");
  }

  const row = (data ?? {}) as RecordMap;
  return {
    schoolId,
    dispatchStartTime: asIso(row.dispatch_start_time),
    noShowWaitSeconds: asNumber(row.no_show_wait_seconds) ?? 120,
    maxDetourMinutes: asNumber(row.max_detour_minutes) ?? 15,
    dispatchLatitude: asNumber(row.dispatch_latitude),
    dispatchLongitude: asNumber(row.dispatch_longitude)
  };
}

export async function getSchoolMapSettings(input: {
  actor: UserProfile;
  schoolId: string;
}): Promise<SchoolMapSettings> {
  requireRoleForSchoolMutation(input.actor, input.schoolId);
  return selectSchoolMapSettings(input.schoolId);
}

export async function upsertSchoolMapSettings(input: {
  actor: UserProfile;
  schoolId: string;
  patch: Partial<SchoolMapSettings>;
}): Promise<SchoolMapSettings> {
  requireRoleForSchoolMutation(input.actor, input.schoolId);
  const current = await selectSchoolMapSettings(input.schoolId);
  const next: SchoolMapSettings = {
    schoolId: input.schoolId,
    dispatchStartTime: input.patch.dispatchStartTime ?? current.dispatchStartTime,
    noShowWaitSeconds: input.patch.noShowWaitSeconds ?? current.noShowWaitSeconds,
    maxDetourMinutes: input.patch.maxDetourMinutes ?? current.maxDetourMinutes,
    dispatchLatitude: input.patch.dispatchLatitude ?? current.dispatchLatitude,
    dispatchLongitude: input.patch.dispatchLongitude ?? current.dispatchLongitude
  };

  const { error } = await getSupabaseAdminClient()
    .from("school_map_settings")
    .upsert({
      school_id: input.schoolId,
      dispatch_start_time: next.dispatchStartTime ?? null,
      no_show_wait_seconds: next.noShowWaitSeconds,
      max_detour_minutes: next.maxDetourMinutes,
      dispatch_latitude: next.dispatchLatitude ?? null,
      dispatch_longitude: next.dispatchLongitude ?? null,
      updated_at: new Date().toISOString()
    }, { onConflict: "school_id" });

  if (error) {
    throw new HttpError(500, error.message, "school_map_settings_upsert_failed");
  }

  return selectSchoolMapSettings(input.schoolId);
}

async function getTripRow(tripId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message, "trip_lookup_failed");
  }

  if (!data) {
    throw new HttpError(404, "Trip not found", "trip_not_found");
  }

  return data as RecordMap;
}

async function listTripStudentRows(tripId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("trip_students")
    .select("student_id, full_name")
    .eq("trip_id", tripId);

  if (error) {
    throw new HttpError(500, error.message, "trip_students_fetch_failed");
  }

  return (data ?? []) as RecordMap[];
}

async function listStudentsByIds(studentIds: string[]) {
  if (studentIds.length === 0) {
    return [] as RecordMap[];
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("students")
    .select("*")
    .in("id", studentIds);

  if (error) {
    throw new HttpError(500, error.message, "students_fetch_failed");
  }

  return (data ?? []) as RecordMap[];
}

async function listApprovedAbsentStudentIds(input: {
  studentIds: string[];
  tripKind: string;
}) {
  if (input.studentIds.length === 0) {
    return new Set<string>();
  }

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await getSupabaseAdminClient()
    .from("leave_requests")
    .select("student_id, trip_kind")
    .eq("status", "approved")
    .in("student_id", input.studentIds)
    .in("trip_kind", [input.tripKind, "both"])
    .gte("leave_date", dayStart.toISOString())
    .lt("leave_date", dayEnd.toISOString());

  if (error) {
    throw new HttpError(500, error.message, "approved_leave_lookup_failed");
  }

  return new Set(
    (data ?? [])
      .map((row) => asString((row as RecordMap).student_id))
      .filter(Boolean)
  );
}

async function listTripStops(tripId: string): Promise<InternalTripStop[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("sequence", { ascending: true });

  if (error) {
    throw new HttpError(500, error.message, "trip_stops_fetch_failed");
  }

  return ((data ?? []) as RecordMap[]).map((row) => ({
    id: asString(row.id),
    schoolId: asString(row.school_id),
    tripId: asString(row.trip_id),
    studentId: asString(row.student_id) || undefined,
    stopId: asString(row.stop_id) || undefined,
    studentName: asString(row.student_name) || undefined,
    addressText: asString(row.address_text) || undefined,
    latitude: asNumber(row.latitude) ?? 0,
    longitude: asNumber(row.longitude) ?? 0,
    sequence: asNumber(row.sequence) ?? 0,
    plannedEta: asIso(row.planned_eta),
    currentEta: asIso(row.current_eta),
    stopStatus: (row.stop_status as TripStopManifestItem["stopStatus"]) ?? "scheduled",
    skipReason: asString(row.skip_reason) || undefined,
    actualArrivedAt: asIso(row.actual_arrived_at),
    actualBoardedAt: asIso(row.actual_boarded_at),
    actualDroppedAt: asIso(row.actual_dropped_at),
    noShowAt: asIso(row.no_show_at)
  }));
}

async function writeTripStops(stops: InternalTripStop[]) {
  const now = new Date().toISOString();
  const client = getSupabaseAdminClient();

  for (const stop of stops) {
    const payload = {
      school_id: stop.schoolId,
      trip_id: stop.tripId,
      student_id: stop.studentId ?? null,
      stop_id: stop.stopId ?? null,
      student_name: stop.studentName ?? null,
      address_text: stop.addressText ?? null,
      latitude: stop.latitude,
      longitude: stop.longitude,
      sequence: stop.sequence,
      planned_eta: stop.plannedEta ?? null,
      current_eta: stop.currentEta ?? null,
      stop_status: stop.stopStatus,
      skip_reason: stop.skipReason ?? null,
      actual_arrived_at: stop.actualArrivedAt ?? null,
      actual_boarded_at: stop.actualBoardedAt ?? null,
      actual_dropped_at: stop.actualDroppedAt ?? null,
      no_show_at: stop.noShowAt ?? null,
      updated_at: now
    };

    if (stop.id) {
      const { error } = await client.from("trip_stops").update(payload).eq("id", stop.id);
      if (error) {
        throw new HttpError(500, error.message, "trip_stop_update_failed");
      }
      continue;
    }

    const { error } = await client.from("trip_stops").insert({
      ...payload,
      created_at: now
    });

    if (error) {
      throw new HttpError(500, error.message, "trip_stop_insert_failed");
    }
  }
}

async function writeRoutePlanVersion(input: {
  schoolId: string;
  tripId: string;
  reason: string;
  routeEngineMode: "google_waypoint" | "nearest_neighbor_fallback";
  createdByUserId?: string;
  stops: InternalTripStop[];
}) {
  const { data: latest, error: latestError } = await getSupabaseAdminClient()
    .from("route_plan_versions")
    .select("version")
    .eq("trip_id", input.tripId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw new HttpError(500, latestError.message, "route_plan_version_lookup_failed");
  }

  const nextVersion = (asNumber((latest as RecordMap | null)?.version) ?? 0) + 1;
  const snapshot = input.stops.map((stop) => ({
    studentId: stop.studentId,
    studentName: stop.studentName,
    addressText: stop.addressText,
    latitude: stop.latitude,
    longitude: stop.longitude,
    sequence: stop.sequence,
    plannedEta: stop.plannedEta,
    currentEta: stop.currentEta,
    stopStatus: stop.stopStatus
  }));

  const { error } = await getSupabaseAdminClient().from("route_plan_versions").insert({
    school_id: input.schoolId,
    trip_id: input.tripId,
    version: nextVersion,
    reason: input.reason,
    route_engine_mode: input.routeEngineMode,
    created_by_user_id: input.createdByUserId ?? null,
    snapshot,
    created_at: new Date().toISOString()
  });

  if (error) {
    throw new HttpError(500, error.message, "route_plan_version_insert_failed");
  }

  return nextVersion;
}

async function writeEtaUpdates(input: {
  schoolId: string;
  tripId: string;
  reason: string;
  stops: InternalTripStop[];
}) {
  const rows = input.stops
    .filter((stop) => stop.currentEta || stop.plannedEta)
    .map((stop) => ({
      school_id: input.schoolId,
      trip_id: input.tripId,
      trip_stop_id: stop.id ?? null,
      student_id: stop.studentId ?? null,
      reason: input.reason,
      eta_at: stop.currentEta ?? stop.plannedEta ?? null,
      planned_eta: stop.plannedEta ?? null,
      created_at: new Date().toISOString()
    }));

  if (!rows.length) {
    return;
  }

  const { error } = await getSupabaseAdminClient().from("eta_updates").insert(rows);
  if (error) {
    throw new HttpError(500, error.message, "eta_updates_insert_failed");
  }
}

function resolveDispatchOrigin(input: {
  trip: RecordMap;
  settings: SchoolMapSettings;
  fallbackStops: InternalTripStop[];
}): LatLng | null {
  const tripOrigin = {
    latitude: asNumber(input.trip.last_location_lat),
    longitude: asNumber(input.trip.last_location_lng)
  };

  if (isValidLatLng(tripOrigin)) {
    return tripOrigin;
  }

  const settingsOrigin = {
    latitude: input.settings.dispatchLatitude,
    longitude: input.settings.dispatchLongitude
  };

  if (isValidLatLng(settingsOrigin)) {
    return settingsOrigin;
  }

  const firstStop = input.fallbackStops[0];
  if (!firstStop) {
    return null;
  }

  return {
    latitude: firstStop.latitude,
    longitude: firstStop.longitude
  };
}

async function recalculateStopEtas(input: {
  origin: LatLng;
  baseIso: string;
  stops: InternalTripStop[];
}) {
  let cursor = input.origin;
  let etaCursor = input.baseIso;

  for (const stop of input.stops) {
    const travelSeconds = await estimateTravelSeconds(cursor, stop, etaCursor);
    const eta = addSeconds(etaCursor, travelSeconds + 30);
    stop.currentEta = eta;
    if (!stop.plannedEta) {
      stop.plannedEta = eta;
    }
    etaCursor = eta;
    cursor = {
      latitude: stop.latitude,
      longitude: stop.longitude
    };
  }
}

async function buildAndStoreTripPlan(input: {
  trip: RecordMap;
  schoolId: string;
  actorUserId?: string;
  reason: string;
  dispatchAt?: string;
}) {
  const tripId = asString(input.trip.id);
  const settings = await selectSchoolMapSettings(input.schoolId);
  const existingStops = await listTripStops(tripId);
  const tripStudentRows = await listTripStudentRows(tripId);
  const studentIds = tripStudentRows
    .map((row) => asString(row.student_id))
    .filter(Boolean);
  const tripKind = asString(input.trip.trip_kind, "pickup");
  const absentStudentIds = await listApprovedAbsentStudentIds({
    studentIds,
    tripKind
  });
  if (absentStudentIds.size > 0) {
    console.info(JSON.stringify({
      scope: "routing",
      event: "reoptimize.absent",
      schoolId: input.schoolId,
      tripId,
      absentCount: absentStudentIds.size
    }));
  }
  const studentRows = await listStudentsByIds(studentIds);
  const studentMap = new Map(studentRows.map((row) => [asString(row.id), row]));
  const tripStudentNameMap = new Map(
    tripStudentRows.map((row) => [asString(row.student_id), asString(row.full_name)])
  );

  const activeStops: InternalTripStop[] = [];
  const completedStops: InternalTripStop[] = existingStops
    .filter((stop) => isCompletedStatus(stop.stopStatus))
    .sort((left, right) => left.sequence - right.sequence);

  for (const studentId of studentIds) {
    const studentRow = studentMap.get(studentId);
    if (!studentRow) {
      continue;
    }

    const existingForStudent = existingStops.find((stop) => stop.studentId === studentId);
    if (absentStudentIds.has(studentId)) {
      if (existingForStudent) {
        existingForStudent.stopStatus = "skipped";
        existingForStudent.skipReason = "approved_leave_absent";
        if (!completedStops.some((stop) => stop.id && stop.id === existingForStudent.id)) {
          completedStops.push(existingForStudent);
        }
      }
      continue;
    }

    const latitude = asNumber(studentRow.lat);
    const longitude = asNumber(studentRow.lng);
    if (
      latitude == null ||
      longitude == null ||
      !isValidLatLng({ latitude, longitude })
    ) {
      continue;
    }

    if (existingForStudent && isCompletedStatus(existingForStudent.stopStatus)) {
      continue;
    }

    activeStops.push({
      id: existingForStudent?.id,
      schoolId: input.schoolId,
      tripId,
      studentId,
      stopId: existingForStudent?.stopId,
      studentName: tripStudentNameMap.get(studentId) || asString(studentRow.full_name) || undefined,
      addressText: asString(studentRow.address_text) || undefined,
      latitude,
      longitude,
      sequence: 0,
      plannedEta: existingForStudent?.plannedEta,
      currentEta: existingForStudent?.currentEta,
      stopStatus: existingForStudent?.stopStatus ?? "scheduled",
      skipReason: existingForStudent?.skipReason,
      actualArrivedAt: existingForStudent?.actualArrivedAt,
      actualBoardedAt: existingForStudent?.actualBoardedAt,
      actualDroppedAt: existingForStudent?.actualDroppedAt,
      noShowAt: existingForStudent?.noShowAt
    });
  }

  if (activeStops.length === 0 && completedStops.length === 0) {
    return {
      hasPlan: false,
      stopCount: 0,
      routeVersion: 0,
      routeEngineMode: "nearest_neighbor_fallback" as const
    };
  }

  const origin = resolveDispatchOrigin({
    trip: input.trip,
    settings,
    fallbackStops: activeStops
  });
  if (!origin) {
    return {
      hasPlan: false,
      stopCount: 0,
      routeVersion: 0,
      routeEngineMode: "nearest_neighbor_fallback" as const
    };
  }

  const optimizedOrder = await optimizeWaypointOrder(origin, activeStops);
  const orderedActiveStops = optimizedOrder.points;
  const routeEngineMode = optimizedOrder.mode;
  const baseIso =
    input.dispatchAt ??
    settings.dispatchStartTime ??
    new Date().toISOString();

  await recalculateStopEtas({
    origin,
    baseIso,
    stops: orderedActiveStops
  });
  completedStops.sort((left, right) => left.sequence - right.sequence);

  const mergedStops: InternalTripStop[] = [];
  let sequence = 1;

  for (const stop of completedStops) {
    stop.sequence = sequence;
    mergedStops.push(stop);
    sequence += 1;
  }

  for (const stop of orderedActiveStops) {
    stop.sequence = sequence;
    mergedStops.push(stop);
    sequence += 1;
  }

  await writeTripStops(mergedStops);
  const persistedStops = await listTripStops(tripId);
  const routeVersion = await writeRoutePlanVersion({
    schoolId: input.schoolId,
    tripId,
    reason: input.reason,
    routeEngineMode,
    createdByUserId: input.actorUserId,
    stops: persistedStops
  });
  await writeEtaUpdates({
    schoolId: input.schoolId,
    tripId,
    reason: input.reason,
    stops: persistedStops
  });

  const nextStop = persistedStops.find((stop) => !isCompletedStatus(stop.stopStatus));
  publishRealtimeEvent({
    type: "trip.reoptimized",
    schoolId: input.schoolId,
    tripId,
    payload: {
      reason: input.reason,
      routeVersion,
      routeEngineMode,
      nextStopEta: nextStop?.currentEta
    }
  });

  publishRealtimeEvent({
    type: "trip.eta.updated",
    schoolId: input.schoolId,
    tripId,
    payload: {
      routeVersion,
      routeEngineMode,
      stopCount: persistedStops.length,
      source: input.reason
    }
  });

  console.info(JSON.stringify({
    scope: "routing",
    event: "trip.reoptimized",
    schoolId: input.schoolId,
    tripId,
    reason: input.reason,
    routeVersion,
    routeEngineMode,
    stopCount: persistedStops.length
  }));

  return {
    hasPlan: true,
    stopCount: persistedStops.length,
    routeVersion,
    routeEngineMode
  };
}

export async function geocodeStudentAddress(input: {
  actor: UserProfile;
  studentId: string;
  addressText?: string;
}): Promise<StudentGeocodeResponse> {
  await assertUserCanAccessStudent(input.actor, input.studentId);

  const { data: student, error } = await getSupabaseAdminClient()
    .from("students")
    .select("*")
    .eq("id", input.studentId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message, "student_lookup_failed");
  }

  if (!student) {
    throw new HttpError(404, "Student not found", "student_not_found");
  }

  const studentRow = student as RecordMap;
  const schoolId = asString(studentRow.school_id);
  requireRoleForSchoolMutation(input.actor, schoolId);

  const addressText = input.addressText?.trim() || asString(studentRow.address_text).trim();
  if (!addressText) {
    throw new HttpError(400, "Student address is required for geocoding", "missing_student_address");
  }

  const geocode = await geocodeAddress(addressText);
  const patch: Record<string, unknown> = {
    address_text: addressText,
    geocode_status: geocode.geocodeStatus,
    place_id: geocode.placeId ?? null,
    lat: geocode.latitude ?? null,
    lng: geocode.longitude ?? null,
    last_geocoded_at: new Date().toISOString(),
    geocode_error: geocode.error ?? null,
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await getSupabaseAdminClient()
    .from("students")
    .update(patch)
    .eq("id", input.studentId);

  if (updateError) {
    throw new HttpError(500, updateError.message, "student_geocode_update_failed");
  }

  return {
    studentId: input.studentId,
    geocodeStatus: geocode.geocodeStatus,
    latitude: geocode.latitude,
    longitude: geocode.longitude,
    placeId: geocode.placeId,
    formattedAddress: geocode.formattedAddress,
    error: geocode.error
  };
}

export async function bulkGeocodeStudents(input: {
  actor: UserProfile;
  schoolId: string;
  forceRefresh?: boolean;
}): Promise<BulkGeocodeResponse> {
  requireRoleForSchoolMutation(input.actor, input.schoolId);

  let query = getSupabaseAdminClient()
    .from("students")
    .select("*")
    .eq("school_id", input.schoolId)
    .not("address_text", "is", null)
    .order("created_at", { ascending: false });

  if (!input.forceRefresh) {
    query = query.neq("geocode_status", "resolved");
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message, "students_bulk_geocode_list_failed");
  }

  const rows = (data ?? []) as RecordMap[];
  const results: StudentGeocodeResponse[] = [];
  for (const row of rows) {
    const studentId = asString(row.id);
    try {
      const result = await geocodeStudentAddress({
        actor: input.actor,
        studentId,
        addressText: asString(row.address_text)
      });
      results.push(result);
    } catch (errorItem) {
      results.push({
        studentId,
        geocodeStatus: "failed",
        error: errorItem instanceof Error ? errorItem.message : "Geocoding failed"
      });
    }
  }

  const successCount = results.filter((result) => result.geocodeStatus === "resolved").length;
  return {
    schoolId: input.schoolId,
    totalStudents: rows.length,
    successCount,
    failureCount: rows.length - successCount,
    results
  };
}

export async function optimizeDailyRoutes(input: {
  actor?: UserProfile;
  schoolId: string;
  dispatchAt?: string;
  reason?: string;
}) {
  if (input.actor) {
    requireRoleForSchoolMutation(input.actor, input.schoolId);
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("trips")
    .select("*")
    .eq("school_id", input.schoolId)
    .in("status", ["scheduled", "ready", "active", "paused"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw new HttpError(500, error.message, "daily_route_optimize_trips_failed");
  }

  const tripRows = (data ?? []) as RecordMap[];
  const plannedTripIds: string[] = [];
  let skippedTrips = 0;
  let routeEngineMode: "google_waypoint" | "nearest_neighbor_fallback" = "nearest_neighbor_fallback";

  for (const tripRow of tripRows) {
    const tripId = asString(tripRow.id);
    const result = await buildAndStoreTripPlan({
      trip: tripRow,
      schoolId: input.schoolId,
      actorUserId: input.actor?.id,
      reason: input.reason?.trim() || "daily_planner",
      dispatchAt: input.dispatchAt
    });

    if (result.hasPlan) {
      plannedTripIds.push(tripId);
      routeEngineMode = result.routeEngineMode;
    } else {
      skippedTrips += 1;
    }
  }

  return {
    schoolId: input.schoolId,
    processedTrips: tripRows.length,
    plannedTrips: plannedTripIds.length,
    skippedTrips,
    tripIds: plannedTripIds,
    routeEngineMode
  };
}

export async function reoptimizeTrip(input: {
  actor: UserProfile;
  tripId: string;
  reason?: string;
}) {
  const tripSummary = await assertUserCanAccessTrip(input.actor, input.tripId);
  if (input.actor.role === "parent") {
    throw new HttpError(403, "Parents cannot reoptimize a trip", "trip_reoptimize_forbidden");
  }

  const trip = await getTripRow(input.tripId);
  const schoolId = asString(trip.school_id) || tripSummary.schoolId;

  const result = await buildAndStoreTripPlan({
    trip,
    schoolId,
    actorUserId: input.actor.id,
    reason: input.reason?.trim() || "event_reoptimize"
  });

  return {
    tripId: input.tripId,
    ...result
  };
}

export async function getTripManifest(input: {
  actor: UserProfile;
  tripId: string;
}): Promise<TripManifestResponse> {
  await assertUserCanAccessTrip(input.actor, input.tripId);

  const stops = await listTripStops(input.tripId);
  const { data: latestVersion, error: latestVersionError } = await getSupabaseAdminClient()
    .from("route_plan_versions")
    .select("version, created_at")
    .eq("trip_id", input.tripId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVersionError) {
    throw new HttpError(500, latestVersionError.message, "route_plan_version_read_failed");
  }

  return {
    tripId: input.tripId,
    routeVersion: asNumber((latestVersion as RecordMap | null)?.version),
    generatedAt: asIso((latestVersion as RecordMap | null)?.created_at),
    stops: stops.map((stop) => ({
      id: stop.id ?? "",
      tripId: stop.tripId,
      schoolId: stop.schoolId,
      sequence: stop.sequence,
      studentId: stop.studentId,
      studentName: stop.studentName,
      stopId: stop.stopId,
      latitude: stop.latitude,
      longitude: stop.longitude,
      addressText: stop.addressText,
      plannedEta: stop.plannedEta,
      currentEta: stop.currentEta,
      stopStatus: stop.stopStatus,
      skipReason: stop.skipReason,
      actualArrivedAt: stop.actualArrivedAt,
      actualBoardedAt: stop.actualBoardedAt,
      actualDroppedAt: stop.actualDroppedAt,
      noShowAt: stop.noShowAt
    }))
  };
}

export async function markTripStop(input: {
  actor: UserProfile;
  tripId: string;
  stopId: string;
  action: TripStopAction;
  notes?: string;
}) {
  const trip = await assertUserCanAccessTrip(input.actor, input.tripId);
  if (input.actor.role === "parent") {
    throw new HttpError(403, "Parents cannot update trip stops", "trip_stop_update_forbidden");
  }

  const { data: stopRowData, error: stopError } = await getSupabaseAdminClient()
    .from("trip_stops")
    .select("*")
    .eq("trip_id", input.tripId)
    .eq("id", input.stopId)
    .maybeSingle();

  if (stopError) {
    throw new HttpError(500, stopError.message, "trip_stop_lookup_failed");
  }

  if (!stopRowData) {
    throw new HttpError(404, "Trip stop not found", "trip_stop_not_found");
  }

  const stopRow = stopRowData as RecordMap;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    updated_at: now
  };

  if (input.action === "arrived") {
    patch.stop_status = "arrived";
    patch.actual_arrived_at = now;
  }

  if (input.action === "boarded") {
    patch.stop_status = "boarded";
    patch.actual_boarded_at = now;
    if (asString(stopRow.student_id)) {
      await createAttendanceRecord({
        tripId: input.tripId,
        studentId: asString(stopRow.student_id),
        eventType: "boarded",
        stopId: asString(stopRow.stop_id) || undefined,
        notes: input.notes,
        recordedByUserId: input.actor.id
      });
    }
  }

  if (input.action === "no_show") {
    patch.stop_status = "no_show";
    patch.skip_reason = "not_boarded_auto_skip";
    patch.no_show_at = now;
    if (asString(stopRow.student_id)) {
      await createAttendanceRecord({
        tripId: input.tripId,
        studentId: asString(stopRow.student_id),
        eventType: "absent",
        stopId: asString(stopRow.stop_id) || undefined,
        notes: input.notes ?? "Auto-marked no-show and removed from remaining route",
        recordedByUserId: input.actor.id
      });
    }
  }

  const { error: updateError } = await getSupabaseAdminClient()
    .from("trip_stops")
    .update(patch)
    .eq("id", input.stopId);

  if (updateError) {
    throw new HttpError(500, updateError.message, "trip_stop_update_failed");
  }

  let reoptimized = false;
  if (input.action === "no_show") {
    console.info(JSON.stringify({
      scope: "routing",
      event: "reoptimize.no_show",
      schoolId: trip.schoolId,
      tripId: input.tripId,
      stopId: input.stopId,
      actorRole: input.actor.role
    }));
    await reoptimizeTrip({
      actor: input.actor,
      tripId: input.tripId,
      reason: "no_show_auto_skip"
    });
    reoptimized = true;
  }

  publishRealtimeEvent({
    type: "trip.stop.status_changed",
    schoolId: trip.schoolId,
    tripId: input.tripId,
    payload: {
      stopId: input.stopId,
      action: input.action,
      status: patch.stop_status
    }
  });

  return {
    ok: true as const,
    tripId: input.tripId,
    stopId: input.stopId,
    stopStatus: (patch.stop_status as TripStopManifestItem["stopStatus"]) ?? "scheduled",
    reoptimized
  };
}

export async function refreshTripEtasFromCurrentLocation(input: {
  tripId: string;
  reason: string;
  schoolId: string;
}) {
  const location = await getTripLocation(input.tripId);
  if (!location) {
    return;
  }

  const stops = await listTripStops(input.tripId);
  const pendingStops = stops
    .filter((stop) => !isCompletedStatus(stop.stopStatus))
    .sort((left, right) => left.sequence - right.sequence);

  if (!pendingStops.length) {
    return;
  }

  await recalculateStopEtas({
    origin: {
      latitude: location.latitude,
      longitude: location.longitude
    },
    baseIso: location.recordedAt,
    stops: pendingStops
  });

  await writeTripStops(pendingStops);
  await writeEtaUpdates({
    schoolId: input.schoolId,
    tripId: input.tripId,
    reason: input.reason,
    stops: pendingStops
  });

  publishRealtimeEvent({
    type: "trip.eta.updated",
    schoolId: input.schoolId,
    tripId: input.tripId,
    payload: {
      source: input.reason,
      stopCount: pendingStops.length
    }
  });
}

export async function listLiveDrivers(input: {
  actor: UserProfile;
  schoolId?: string;
  clusterMode?: "grid";
}) {
  if (input.actor.role !== "admin" && input.actor.role !== "super_admin") {
    throw new HttpError(403, "Only school admins and super admins can access live maps", "maps_access_forbidden");
  }

  if (input.actor.role === "admin") {
    if (input.schoolId && input.schoolId !== input.actor.schoolId) {
      throw new HttpError(403, "You cannot access another school's map", "maps_access_forbidden");
    }
  }

  const scopeSchoolId = input.actor.role === "admin" ? input.actor.schoolId : input.schoolId;
  let query = getSupabaseAdminClient()
    .from("trips")
    .select("*")
    .in("status", ["ready", "active", "paused"])
    .order("updated_at", { ascending: false });

  if (scopeSchoolId) {
    query = query.eq("school_id", scopeSchoolId);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message, "live_driver_map_fetch_failed");
  }

  const trips = (data ?? []) as RecordMap[];
  const items: LiveDriverMapItem[] = [];

  for (const trip of trips) {
    const tripId = asString(trip.id);
    const stops = await listTripStops(tripId);
    const nextStop = stops
      .filter((stop) => !isCompletedStatus(stop.stopStatus))
      .sort((left, right) => left.sequence - right.sequence)[0];

    const plannedMs = nextStop?.plannedEta ? Date.parse(nextStop.plannedEta) : NaN;
    const currentMs = nextStop?.currentEta ? Date.parse(nextStop.currentEta) : NaN;
    const etaDelayMinutes =
      Number.isFinite(plannedMs) && Number.isFinite(currentMs)
        ? Math.max(0, Math.round((currentMs - plannedMs) / 60000))
        : 0;

    items.push({
      tripId,
      schoolId: asString(trip.school_id),
      schoolName: asString(trip.school_name) || undefined,
      driverId: asString(trip.driver_id) || undefined,
      driverName: asString(trip.driver_name) || undefined,
      busLabel: asString(trip.bus_label) || undefined,
      routeName: asString(trip.route_name) || undefined,
      status: (trip.status as LiveDriverMapItem["status"]) ?? "scheduled",
      latitude: asNumber(trip.last_location_lat),
      longitude: asNumber(trip.last_location_lng),
      heading: asNumber(trip.last_location_heading),
      speedKph: asNumber(trip.last_location_speed_kph),
      locationRecordedAt: asIso(trip.last_location_at),
      nextStopName: nextStop?.studentName ?? nextStop?.addressText,
      nextStopEta: nextStop?.currentEta ?? nextStop?.plannedEta,
      etaDelayMinutes,
      isDelayed: etaDelayMinutes >= 5,
      clusterKey:
        input.actor.role === "super_admin" && input.clusterMode === "grid" && asNumber(trip.last_location_lat) != null && asNumber(trip.last_location_lng) != null
          ? `${Math.round((asNumber(trip.last_location_lat) ?? 0) * 20) / 20},${Math.round((asNumber(trip.last_location_lng) ?? 0) * 20) / 20}`
          : undefined
    });
  }

  return items;
}

export async function getParentLiveTrip(input: {
  actor: UserProfile;
  studentId: string;
}): Promise<ParentLiveTrip> {
  if (input.actor.role !== "parent" && input.actor.role !== "super_admin" && input.actor.role !== "admin") {
    throw new HttpError(403, "You cannot access parent live trip data", "parent_live_trip_forbidden");
  }

  await assertUserCanAccessStudent(input.actor, input.studentId);

  const { data: tripStudents, error: tripStudentsError } = await getSupabaseAdminClient()
    .from("trip_students")
    .select("trip_id")
    .eq("student_id", input.studentId);

  if (tripStudentsError) {
    throw new HttpError(500, tripStudentsError.message, "parent_live_trip_lookup_failed");
  }

  const tripIds = (tripStudents ?? [])
    .map((row) => asString((row as RecordMap).trip_id))
    .filter(Boolean);

  if (!tripIds.length) {
    return {
      studentId: input.studentId,
      trip: null,
      busLocation: null,
      studentStop: null,
      nextStop: null
    };
  }

  const { data: tripRows, error: tripRowsError } = await getSupabaseAdminClient()
    .from("trips")
    .select("*")
    .in("id", tripIds)
    .in("status", ["ready", "active", "paused"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (tripRowsError) {
    throw new HttpError(500, tripRowsError.message, "parent_live_trip_trip_fetch_failed");
  }

  const tripRow = (tripRows?.[0] ?? null) as RecordMap | null;
  if (!tripRow) {
    return {
      studentId: input.studentId,
      trip: null,
      busLocation: null,
      studentStop: null,
      nextStop: null
    };
  }

  const tripId = asString(tripRow.id);
  const trip = await assertUserCanAccessTrip(input.actor, tripId);
  const busLocation = await getTripLocation(tripId);
  const stops = await listTripStops(tripId);
  const studentStop = stops.find((stop) => stop.studentId === input.studentId) ?? null;
  const nextStop = stops
    .filter((stop) => !isCompletedStatus(stop.stopStatus))
    .sort((left, right) => left.sequence - right.sequence)[0] ?? null;

  return {
    studentId: input.studentId,
    trip,
    busLocation,
    studentStop: studentStop ? mapTripStop({
      id: studentStop.id,
      trip_id: studentStop.tripId,
      school_id: studentStop.schoolId,
      sequence: studentStop.sequence,
      student_id: studentStop.studentId,
      student_name: studentStop.studentName,
      stop_id: studentStop.stopId,
      latitude: studentStop.latitude,
      longitude: studentStop.longitude,
      address_text: studentStop.addressText,
      planned_eta: studentStop.plannedEta,
      current_eta: studentStop.currentEta,
      stop_status: studentStop.stopStatus,
      skip_reason: studentStop.skipReason,
      actual_arrived_at: studentStop.actualArrivedAt,
      actual_boarded_at: studentStop.actualBoardedAt,
      actual_dropped_at: studentStop.actualDroppedAt,
      no_show_at: studentStop.noShowAt
    }) : null,
    nextStop: nextStop ? mapTripStop({
      id: nextStop.id,
      trip_id: nextStop.tripId,
      school_id: nextStop.schoolId,
      sequence: nextStop.sequence,
      student_id: nextStop.studentId,
      student_name: nextStop.studentName,
      stop_id: nextStop.stopId,
      latitude: nextStop.latitude,
      longitude: nextStop.longitude,
      address_text: nextStop.addressText,
      planned_eta: nextStop.plannedEta,
      current_eta: nextStop.currentEta,
      stop_status: nextStop.stopStatus,
      skip_reason: nextStop.skipReason,
      actual_arrived_at: nextStop.actualArrivedAt,
      actual_boarded_at: nextStop.actualBoardedAt,
      actual_dropped_at: nextStop.actualDroppedAt,
      no_show_at: nextStop.noShowAt
    }) : null,
    estimatedDropoffAt: studentStop?.currentEta ?? studentStop?.plannedEta,
    lastUpdatedAt: busLocation?.recordedAt ?? asIso(tripRow.updated_at)
  };
}
