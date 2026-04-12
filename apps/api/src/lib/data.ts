import type {
  AlertRecord,
  AlertSeverity,
  AlertStatus,
  AttendanceEventType,
  AttendanceRecord,
  DashboardSummary,
  LeaveRequestRecord,
  LeaveRequestStatus,
  NightlyPlannerRun,
  StudentSummary,
  TripLocation,
  TripSummary,
  UserProfile
} from "@school-bus/shared";

import { HttpError } from "./http.js";
import { getSupabaseAdminClient } from "./supabase.js";

type RecordMap = Record<string, unknown>;

function isSuperAdmin(userOrRole: Pick<UserProfile, "role"> | UserProfile["role"]) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  return role === "super_admin";
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function toIsoString(value: unknown, fallback?: string) {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return fallback;
}

function requireData<T>(data: T | null, error: { message: string; code: string; status?: number }) {
  if (!data) {
    throw new HttpError(error.status ?? 404, error.message, error.code);
  }

  return data;
}

function mapUserProfile(row: RecordMap): UserProfile {
  let fullName = asString(row.full_name);
  if (!fullName || fullName === "Unknown User") {
    const first = asString(row.first_name);
    const last = asString(row.last_name);
    fullName = [first, last].filter(Boolean).join(" ");
  }
  if (!fullName) fullName = "Unknown User";

  return {
    id: asString(row.id),
    schoolId: asString(row.school_id),
    role: (row.role as UserProfile["role"]) ?? "parent",
    fullName,
    phoneE164: asString(row.phone_e164 || row.phone_number),
    email: typeof row.email === "string" ? row.email : undefined,
    gender: typeof row.gender === "string" ? row.gender : undefined,
    dateOfBirth: toIsoString(row.date_of_birth),
    assignedBusId: asString(row.assigned_bus_id) || undefined,
    busLabel: asString(row.vehicle_number || row.bus_label) || undefined,
    busPlate: asString(row.plate || row.bus_plate) || undefined,
  };
}


function mapTripSummary(row: RecordMap): TripSummary {
  const driverRow = row.driver as RecordMap | undefined;
  const busRow = row.bus as RecordMap | undefined;
  
  const rawStatus = asString(row.status);
  let status: TripSummary["status"] = "scheduled";
  
  if (rawStatus === "planned") status = "ready";
  else if (rawStatus === "dispatched" || rawStatus === "in_progress") status = "active";
  else if (rawStatus === "completed") status = "completed";
  else if (rawStatus === "cancelled") status = "cancelled";
  else if (rawStatus === "ready") status = "ready";
  else if (rawStatus === "active") status = "active";

  return {
    id: asString(row.id),
    schoolId: asString(row.school_id),
    routeId: typeof row.route_id === "string" ? row.route_id : undefined,
    busId: typeof row.bus_id === "string" ? row.bus_id : undefined,
    driverId: typeof row.driver_id === "string" ? row.driver_id : undefined,
    routeName: asString(row.route_name, "Assigned Route"),
    busLabel: asString(row.bus_label, "Assigned Bus"),
    driverName: asString(row.driver_name, "Assigned Driver"),
    status,
    lastUpdatedAt:
      toIsoString(row.last_location_at) ??
      toIsoString(row.updated_at) ??
      toIsoString(row.started_at),
    tripKind: (row.trip_kind as TripSummary["tripKind"]) ?? "pickup",
    driverPhone: asString(driverRow?.phone_number) || undefined,
    driverLicenseNo: asString(driverRow?.license_number) || undefined,
    busCapacity: asNumber(busRow?.capacity),
    busPlate: asString(busRow?.number) || undefined,
  };
}

function mapTripLocation(row: RecordMap | null): TripLocation | null {
  if (!row) {
    return null;
  }

  const latitude = asNumber(row.latitude ?? row.last_location_lat);
  const longitude = asNumber(row.longitude ?? row.last_location_lng);
  if (latitude == null || longitude == null) {
    return null;
  }

  return {
    latitude,
    longitude,
    speedKph: asNumber(row.speed_kph ?? row.last_location_speed_kph),
    heading: asNumber(row.heading ?? row.last_location_heading),
    recordedAt:
      toIsoString(row.recorded_at ?? row.last_location_at) ?? new Date().toISOString()
  };
}

function mapStudentSummary(row: RecordMap): StudentSummary {
  const rawFullName = asString(row.full_name);
  const fullName = rawFullName || [asString(row.first_name), asString(row.last_name)].filter(Boolean).join(" ") || "Student";
  return {
    id: asString(row.student_id ?? row.id),
    fullName,
    grade: asString(row.grade),
    assignedBusLabel: asString(row.assigned_bus_label),
    assignedRouteName: asString(row.assigned_route_name)
  };
}

function mapAttendanceRecord(row: RecordMap): AttendanceRecord {
  return {
    id: asString(row.id),
    studentId: asString(row.student_id),
    studentName: typeof row.student_name === "string" ? row.student_name : undefined,
    eventType: (row.event_type as AttendanceEventType) ?? "boarded",
    stopId: typeof row.stop_id === "string" ? row.stop_id : undefined,
    recordedAt: toIsoString(row.recorded_at) ?? new Date().toISOString(),
    recordedByUserId: asString(row.recorded_by_user_id),
    notes: typeof row.notes === "string" ? row.notes : undefined
  };
}

function mapAlertRecord(row: RecordMap): AlertRecord {
  const type = (row.type ?? row.alert_type) as AlertRecord["type"];
  return {
    id: asString(row.id),
    schoolId: asString(row.school_id),
    tripId: typeof row.trip_id === "string" ? row.trip_id : undefined,
    type,
    severity: (row.severity as AlertSeverity) ?? "medium",
    status: (row.status as AlertStatus) ?? "open",
    message: asString(row.message),
    triggeredByUserId: asString(row.triggered_by_user_id),
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    acknowledgedAt: toIsoString(row.acknowledged_at),
    resolvedAt: toIsoString(row.resolved_at),
    resolutionNote: typeof row.resolution_note === "string" ? row.resolution_note : undefined
  };
}

function mapLeaveRequest(row: RecordMap): LeaveRequestRecord {
  return {
    id: asString(row.id),
    studentId: asString(row.student_id),
    requestedByParentId: asString(row.requested_by_parent_id),
    leaveDate: toIsoString(row.leave_date) ?? new Date().toISOString(),
    tripKind: (row.trip_kind as LeaveRequestRecord["tripKind"]) ?? "pickup",
    reason: typeof row.reason === "string" ? row.reason : undefined,
    status: (row.status as LeaveRequestStatus) ?? "pending",
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString()
  };
}

function mapNightlyPlannerRun(row: RecordMap): NightlyPlannerRun {
  return {
    id: asString(row.id),
    schoolId: asString(row.school_id),
    runDate: toIsoString(row.run_date) ?? new Date().toISOString(),
    triggerType: (row.trigger_type as NightlyPlannerRun["triggerType"]) ?? "automatic",
    status: (row.status as NightlyPlannerRun["status"]) ?? "success",
    processedTrips: asNumber(row.processed_trips) ?? 0,
    plannedTrips: asNumber(row.planned_trips) ?? 0,
    skippedTrips: asNumber(row.skipped_trips) ?? 0,
    errorCode: asString(row.error_code) || undefined,
    errorMessage: asString(row.error_message) || undefined,
    startedAt: toIsoString(row.started_at) ?? new Date().toISOString(),
    finishedAt: toIsoString(row.finished_at) ?? new Date().toISOString()
  };
}

async function selectOne(table: string, column: string, value: string) {
  const selection = table === "trips" ? "*, driver:drivers(*), bus:buses(*)" : "*";
  const { data, error } = await getSupabaseAdminClient()
    .from(table)
    .select(selection)
    .eq(column, value)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message, `select_${table}_failed`);
  }

  return data as RecordMap | null;
}

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  const row = await selectOne("users", "id", userId);
  return row ? mapUserProfile(row) : null;
}

export async function getUserProfileByAuthUserId(authUserId: string): Promise<UserProfile | null> {
  const admin = getSupabaseAdminClient();
  const userRow = await selectOne("users", "auth_user_id", authUserId);
  if (!userRow) return null;

  const user = userRow as RecordMap;
  
  // If driver, fetch driver details and assigned bus info
  if (user.role === "driver") {
    const { data: driverRow } = await admin
      .from("drivers")
      .select("*, buses!left(vehicle_number, plate)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (driverRow) {
      const driver = driverRow as RecordMap;
      const bus = driver.buses as RecordMap | undefined;
      return mapUserProfile({
        ...user,
        ...driver,
        bus_label: bus?.vehicle_number,
        bus_plate: bus?.plate,
      });
    }
  }

  return mapUserProfile(user);
}

async function hasGuardianLink(parentUserId: string, studentId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("student_guardians")
    .select("student_id")
    .eq("parent_id", parentUserId)
    .eq("student_id", studentId)
    .limit(1);

  if (error) {
    throw new HttpError(500, error.message, "guardian_link_check_failed");
  }

  return (data?.length ?? 0) > 0;
}

async function getGuardianStudentIds(parentUserId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("student_guardians")
    .select("student_id")
    .eq("parent_id", parentUserId);

  if (error) {
    throw new HttpError(500, error.message, "guardian_students_fetch_failed");
  }

  return (data ?? [])
    .map((row) => asString((row as RecordMap).student_id))
    .filter(Boolean);
}

async function hasTripStudentLink(tripId: string, studentId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("trip_students")
    .select("student_id")
    .eq("trip_id", tripId)
    .eq("student_id", studentId)
    .limit(1);

  if (error) {
    throw new HttpError(500, error.message, "trip_student_link_check_failed");
  }

  return (data?.length ?? 0) > 0;
}

async function getTripStudentIds(tripId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("trip_students")
    .select("student_id")
    .eq("trip_id", tripId);

  if (error) {
    throw new HttpError(500, error.message, "trip_students_lookup_failed");
  }

  return (data ?? [])
    .map((row) => asString((row as RecordMap).student_id))
    .filter(Boolean);
}

export async function assertUserCanAccessStudent(user: UserProfile, studentId: string) {
  if (isSuperAdmin(user)) {
    return;
  }

  if (user.role === "parent") {
    const allowed = await hasGuardianLink(user.id, studentId);
    if (!allowed) {
      throw new HttpError(403, "You cannot access this student", "student_access_forbidden");
    }
    return;
  }

  if (user.role === "admin") {
    const student = requireData(await selectOne("students", "id", studentId), {
      message: "Student not found",
      code: "student_not_found"
    });
    if (asString(student.school_id) !== user.schoolId) {
      throw new HttpError(403, "You cannot access this student", "student_access_forbidden");
    }
    return;
  }

  throw new HttpError(403, "You cannot access this student", "student_access_forbidden");
}

export async function assertUserCanAccessTrip(user: UserProfile, tripId: string) {
  const trip = requireData(await selectOne("trips", "id", tripId), {
    message: "Trip not found",
    code: "trip_not_found"
  });

  if (isSuperAdmin(user)) {
    return mapTripSummary(trip);
  }

  const tripSchoolId = asString(trip.school_id);
  if (user.role === "admin") {
    if (tripSchoolId !== user.schoolId) {
      throw new HttpError(403, "You cannot access this trip", "trip_access_forbidden");
    }
    return mapTripSummary(trip);
  }

  if (user.role === "driver") {
    if (asString(trip.driver_id) !== user.id || tripSchoolId !== user.schoolId) {
      throw new HttpError(403, "You cannot access this trip", "trip_access_forbidden");
    }
    return mapTripSummary(trip);
  }

  if (user.role === "parent") {
    const studentIds = await getTripStudentIds(tripId);
    if (studentIds.length === 0) {
      throw new HttpError(403, "You cannot access this trip", "trip_access_forbidden");
    }

    const { data: guardianRows, error: guardianError } = await getSupabaseAdminClient()
      .from("student_guardians")
      .select("student_id")
      .eq("parent_id", user.id)
      .in("student_id", studentIds);

    if (guardianError) {
      throw new HttpError(500, guardianError.message, "trip_access_parent_check_failed");
    }

    if ((guardianRows?.length ?? 0) === 0) {
      throw new HttpError(403, "You cannot access this trip", "trip_access_forbidden");
    }

    return mapTripSummary(trip);
  }

  throw new HttpError(403, "You cannot access this trip", "trip_access_forbidden");
}

export async function assertUserCanRecordAttendance(
  user: UserProfile,
  tripId: string,
  studentId: string
) {
  const trip = await assertUserCanAccessTrip(user, tripId);
  if (user.role === "parent") {
    throw new HttpError(403, "Parents cannot record attendance", "attendance_write_forbidden");
  }

  if (!isSuperAdmin(user) && user.role !== "admin" && user.role !== "driver") {
    throw new HttpError(403, "You cannot record attendance for this trip", "attendance_write_forbidden");
  }

  const linked = await hasTripStudentLink(tripId, studentId);
  if (!linked) {
    throw new HttpError(400, "Student is not assigned to this trip", "student_not_in_trip");
  }

  return trip;
}

export async function getCurrentTripForUser(user: UserProfile): Promise<{
  trip: TripSummary | null;
  students: StudentSummary[];
  lastLocation: TripLocation | null;
}> {
  let row: RecordMap | null = null;

  if (user.role === "parent") {
    const guardianStudentIds = await getGuardianStudentIds(user.id);
    if (guardianStudentIds.length === 0) {
      return { trip: null, students: [], lastLocation: null };
    }

    const { data: tripStudentRows, error: tripStudentError } = await getSupabaseAdminClient()
      .from("trip_students")
      .select("trip_id, student_id")
      .in("student_id", guardianStudentIds);

    if (tripStudentError) {
      throw new HttpError(500, tripStudentError.message, "current_trip_parent_link_failed");
    }

    const tripIds = Array.from(
      new Set(
        (tripStudentRows ?? [])
          .map((tripStudentRow) => asString((tripStudentRow as RecordMap).trip_id))
          .filter(Boolean)
      )
    );

    if (tripIds.length === 0) {
      return { trip: null, students: [], lastLocation: null };
    }

    const { data, error } = await getSupabaseAdminClient()
      .from("trips")
      .select("*, driver:drivers(*), bus:buses(*)")
      .eq("school_id", user.schoolId)
      .in("id", tripIds)
      .in("status", ["planned", "scheduled", "ready", "active", "paused"])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new HttpError(500, error.message, "current_trip_failed");
    }

    row = (data?.[0] ?? null) as RecordMap | null;
  } else {
    let query = getSupabaseAdminClient()
      .from("trips")
      .select("*, driver:drivers(*), bus:buses(*)")
      .in("status", ["planned", "scheduled", "ready", "active", "paused"])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!isSuperAdmin(user)) {
      query = query.eq("school_id", user.schoolId);
    }

    if (user.role === "driver") {
      query = query.eq("driver_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(500, error.message, "current_trip_failed");
    }

    row = (data?.[0] ?? null) as RecordMap | null;
  }

  if (!row) {
    return { trip: null, students: [], lastLocation: null };
  }

  const trip = mapTripSummary(row);
  let students =
    user.role === "parent"
      ? await getTripStudentsForParent(trip.id, user.id)
      : await getTripStudents(trip.id);

  // BUGFIX: Synchronize master assignments if trip is empty for a driver
  if (user.role === "driver" && students.length === 0 && trip.routeId) {
    const admin = getSupabaseAdminClient();
    
    // Fetch master assignments for this route
    const { data: assignments, error: assignError } = await admin
      .from("student_transport_assignments")
      .select("student_id")
      .eq("route_id", trip.routeId)
      .eq("is_active", true);
    
    if (!assignError && assignments && assignments.length > 0) {
      // Create trip_students links
      const linkPayloads = assignments.map((assign) => ({
        trip_id: trip.id,
        student_id: (assign as RecordMap).student_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await admin
        .from("trip_students")
        .insert(linkPayloads);
        
      if (!insertError) {
        // Re-fetch the student list
        students = await getTripStudents(trip.id);
      }
    }
  }

  return {
    trip,
    students,
    lastLocation: mapTripLocation(row)
  };
}

export async function initializeTripForDriver(user: UserProfile): Promise<TripSummary> {
  const admin = getSupabaseAdminClient();
  
  // 1. Find the driver profile and their assigned bus/route
  const { data: driver, error: driverError } = await admin
    .from("drivers")
    .select("id, assigned_bus_id")
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (driverError || !driver) {
    throw new HttpError(404, "Driver profile not found", "driver_not_found");
  }
  
  let assignedBusId = (driver as RecordMap).assigned_bus_id as string | undefined;
  
  // FALLBACK: If driver record is missing assigned_bus_id, check if any bus has this driver assigned
  if (!assignedBusId) {
    const { data: busByDriver } = await admin
      .from("buses")
      .select("id")
      .eq("driver_id", (driver as RecordMap).id)
      .maybeSingle();
      
    if (busByDriver) {
      assignedBusId = busByDriver.id;
      // Self-heal: Update driver record for future consistency
      await admin
        .from("drivers")
        .update({ assigned_bus_id: assignedBusId })
        .eq("id", (driver as RecordMap).id);
    }
  }

  if (!assignedBusId) {
    throw new HttpError(400, "No bus assigned to this driver. Please contact admin.", "no_bus_assigned");
  }
  
  // 2. Find the route for this bus
  const { data: bus, error: busError } = await admin
    .from("buses")
    .select("route_id, vehicle_number, plate")
    .eq("id", assignedBusId)
    .maybeSingle();
    
  if (busError || !bus) {
    throw new HttpError(404, "Assigned bus not found", "bus_not_found");
  }
  
  const routeId = (bus as RecordMap).route_id as string | undefined;
  if (!routeId) {
    throw new HttpError(400, "Assigned bus has no route. Please contact admin.", "no_route_assigned");
  }
  
  // 3. Create the trip
  const tripId = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const { data: newTrip, error: createError } = await admin
    .from("trips")
    .insert({
      id: tripId,
      school_id: user.schoolId,
      driver_id: (driver as RecordMap).id,
      bus_id: assignedBusId,
      route_id: routeId,
      direction: "pickup", // Default to pickup for now
      status: "planned",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (createError || !newTrip) {
    throw new HttpError(500, `Failed to initialize trip: ${createError?.message}`, "trip_init_failed");
  }

  // 4. Trigger student sync (optional but good for consistency)
  // Our getCurrentTripForUser will handle this automatically on first load,
  // but let's pre-populate it to be safe.
  const { data: assignments } = await admin
    .from("student_transport_assignments")
    .select("student_id")
    .eq("route_id", routeId)
    .eq("is_active", true);
    
  if (assignments && assignments.length > 0) {
    const linkPayloads = assignments.map((assign) => ({
      trip_id: tripId,
      student_id: (assign as RecordMap).student_id
    }));
    await admin.from("trip_students").insert(linkPayloads);
  }
  
  return mapTripSummary(newTrip as RecordMap);
}

export async function getTripById(tripId: string) {
  const row = await selectOne("trips", "id", tripId);
  return row ? mapTripSummary(row) : null;
}

export async function getTripStudents(tripId: string): Promise<StudentSummary[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("trip_students")
    .select("*, students!inner(*)")
    .eq("trip_id", tripId);

  if (error) {
    throw new HttpError(500, error.message, "trip_students_failed");
  }

  return (data ?? []).map((row) => {
    const studentData = (row as RecordMap).students as RecordMap | undefined;
    return mapStudentSummary({ ...(row as RecordMap), ...studentData });
  });
}

export async function getTripStudentsForParent(
  tripId: string,
  parentUserId: string
): Promise<StudentSummary[]> {
  const guardianStudentIds = await getGuardianStudentIds(parentUserId);
  if (guardianStudentIds.length === 0) {
    return [];
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("trip_students")
    .select("*, students!inner(*)")
    .eq("trip_id", tripId)
    .in("student_id", guardianStudentIds);

  if (error) {
    throw new HttpError(500, error.message, "trip_students_parent_failed");
  }

  return (data ?? []).map((row) => {
    const studentData = (row as RecordMap).students as RecordMap | undefined;
    return mapStudentSummary({ ...(row as RecordMap), ...studentData });
  });
}

export async function getTripLocation(tripId: string): Promise<TripLocation | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("trip_locations")
    .select("*")
    .eq("trip_id", tripId)
    .order("recorded_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new HttpError(500, error.message, "trip_location_failed");
  }

  return mapTripLocation((data?.[0] ?? null) as RecordMap | null);
}

export async function updateTripStatus(tripId: string, status: string, actorUserId: string) {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    updated_by_user_id: actorUserId
  };

  if (status === "active") {
    patch.started_at = new Date().toISOString();
  }

  if (status === "completed") {
    patch.ended_at = new Date().toISOString();
  }

  const { error } = await getSupabaseAdminClient()
    .from("trips")
    .update(patch)
    .eq("id", tripId);

  if (error) {
    throw new HttpError(500, error.message, "trip_status_update_failed");
  }
}

export async function reassignTripDriver(input: {
  actor: UserProfile;
  tripId: string;
  driverId: string;
}) {
  if (input.actor.role !== "admin" && input.actor.role !== "super_admin") {
    throw new HttpError(403, "Only admins can reassign drivers", "trip_reassign_forbidden");
  }

  const tripRow = requireData(await selectOne("trips", "id", input.tripId), {
    message: "Trip not found",
    code: "trip_not_found"
  });
  const tripSchoolId = asString(tripRow.school_id);
  if (input.actor.role === "admin" && input.actor.schoolId !== tripSchoolId) {
    throw new HttpError(403, "You cannot reassign another school's trip", "trip_reassign_forbidden");
  }

  const driverRow = requireData(await selectOne("users", "id", input.driverId), {
    message: "Driver not found",
    code: "driver_not_found"
  });
  if (asString(driverRow.role) !== "driver") {
    throw new HttpError(400, "Selected user is not a driver", "invalid_driver_role");
  }

  if (asString(driverRow.school_id) !== tripSchoolId) {
    throw new HttpError(400, "Driver must belong to the same school as trip", "driver_school_mismatch");
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("trips")
    .update({
      driver_id: input.driverId,
      driver_name: asString(driverRow.full_name, "Assigned Driver"),
      updated_at: new Date().toISOString(),
      updated_by_user_id: input.actor.id
    })
    .eq("id", input.tripId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, error.message, "trip_driver_reassign_failed");
  }

  return mapTripSummary(data as RecordMap);
}

export async function addTripLocation(input: {
  tripId: string;
  latitude: number;
  longitude: number;
  speedKph?: number;
  heading?: number;
  recordedAt: string;
  actorUserId: string;
}) {
  const payload = {
    trip_id: input.tripId,
    latitude: input.latitude,
    longitude: input.longitude,
    speed_kph: input.speedKph ?? null,
    heading: input.heading ?? null,
    recorded_at: input.recordedAt,
    created_by_user_id: input.actorUserId
  };

  const client = getSupabaseAdminClient();
  const { error: insertError } = await client.from("trip_locations").insert(payload);
  if (insertError) {
    throw new HttpError(500, insertError.message, "trip_location_insert_failed");
  }

  const { error: updateError } = await client
    .from("trips")
    .update({
      last_location_lat: input.latitude,
      last_location_lng: input.longitude,
      last_location_speed_kph: input.speedKph ?? null,
      last_location_heading: input.heading ?? null,
      last_location_at: input.recordedAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.tripId);

  if (updateError) {
    throw new HttpError(500, updateError.message, "trip_last_location_update_failed");
  }
}

export async function listAttendanceRecords(tripId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("attendance_events")
    .select("*")
    .eq("trip_id", tripId)
    .order("recorded_at", { ascending: false });

  if (error) {
    throw new HttpError(500, error.message, "attendance_list_failed");
  }

  return (data ?? []).map((row) => mapAttendanceRecord(row as RecordMap));
}

export async function createAttendanceRecord(input: {
  tripId: string;
  studentId: string;
  eventType: AttendanceEventType;
  stopId?: string;
  notes?: string;
  recordedByUserId: string;
}) {
  const studentRow = await selectOne("students", "id", input.studentId);
  const studentName = asString(studentRow?.full_name, "Student");

  const { data, error } = await getSupabaseAdminClient()
    .from("attendance_events")
    .insert({
      trip_id: input.tripId,
      student_id: input.studentId,
      student_name: studentName,
      event_type: input.eventType,
      stop_id: input.stopId ?? null,
      notes: input.notes ?? null,
      recorded_by_user_id: input.recordedByUserId,
      recorded_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, error.message, "attendance_create_failed");
  }

  return mapAttendanceRecord(data as RecordMap);
}

export async function getStudentAttendanceHistory(studentId: string, schoolId?: string) {
  let query = getSupabaseAdminClient()
    .from("attendance_events")
    .select("*, trips(status, route_name, bus_label, trip_kind)")
    .eq("student_id", studentId)
    .order("recorded_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, error.message, "student_attendance_history_failed");
  }

  return data ?? [];
}

export async function createAlert(input: {
  schoolId: string;
  tripId?: string;
  type: AlertRecord["type"];
  severity: AlertSeverity;
  message: string;
  triggeredByUserId: string;
}) {
  const { data, error } = await getSupabaseAdminClient()
    .from("alerts")
    .insert({
      school_id: input.schoolId,
      trip_id: input.tripId ?? null,
      type: input.type,
      severity: input.severity,
      status: "open",
      message: input.message,
      triggered_by_user_id: input.triggeredByUserId,
      created_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, error.message, "alert_create_failed");
  }

  return mapAlertRecord(data as RecordMap);
}

export async function assertUserCanAccessAlert(user: UserProfile, alertId: string) {
  const alert = requireData(await selectOne("alerts", "id", alertId), {
    message: "Alert not found",
    code: "alert_not_found"
  });

  if (isSuperAdmin(user)) {
    return mapAlertRecord(alert);
  }

  if (user.role === "admin" || user.role === "driver") {
    if (asString(alert.school_id) !== user.schoolId) {
      throw new HttpError(403, "You cannot access this alert", "alert_access_forbidden");
    }

    return mapAlertRecord(alert);
  }

  throw new HttpError(403, "You cannot access this alert", "alert_access_forbidden");
}

export async function listAlerts(schoolId?: string) {
  const query = schoolId
    ? getSupabaseAdminClient()
        .from("alerts")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
    : getSupabaseAdminClient()
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

  const result = await query;

  if (result.error) {
    throw new HttpError(500, result.error.message, "alerts_list_failed");
  }

  return (result.data ?? []).map((row) => mapAlertRecord(row as RecordMap));
}

export async function updateAlertStatus(input: {
  alertId: string;
  status: Extract<AlertStatus, "acknowledged" | "resolved">;
  resolutionNote?: string;
}) {
  const patch: Record<string, unknown> = {
    status: input.status
  };

  if (input.status === "acknowledged") {
    patch.acknowledged_at = new Date().toISOString();
  }

  if (input.status === "resolved") {
    patch.resolved_at = new Date().toISOString();
    patch.resolution_note = input.resolutionNote ?? null;
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("alerts")
    .update(patch)
    .eq("id", input.alertId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, error.message, "alert_update_failed");
  }

  return mapAlertRecord(data as RecordMap);
}

export async function createLeaveRequest(input: {
  studentId: string;
  requestedByParentId: string;
  leaveDate: string;
  tripKind: LeaveRequestRecord["tripKind"];
  reason?: string;
}) {
  const { data, error } = await getSupabaseAdminClient()
    .from("leave_requests")
    .insert({
      student_id: input.studentId,
      requested_by_parent_id: input.requestedByParentId,
      leave_date: input.leaveDate,
      trip_kind: input.tripKind,
      reason: input.reason ?? null,
      status: "pending",
      created_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, error.message, "leave_request_create_failed");
  }

  return mapLeaveRequest(data as RecordMap);
}

export async function listLeaveRequests(user: UserProfile) {
  let query = getSupabaseAdminClient()
    .from("leave_requests")
    .select("*")
    .order("leave_date", { ascending: false });

  if (user.role === "parent") {
    query = query.eq("requested_by_parent_id", user.id);
  } else if (user.role === "driver") {
    query = query.eq("school_id", user.schoolId);
  } else if (!isSuperAdmin(user)) {
    query = query.eq("school_id", user.schoolId);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, error.message, "leave_requests_list_failed");
  }

  return (data ?? []).map((row) => mapLeaveRequest(row as RecordMap));
}

export async function updateLeaveRequestStatus(input: {
  actor: UserProfile;
  leaveRequestId: string;
  status: Extract<LeaveRequestStatus, "approved" | "rejected">;
}) {
  const row = requireData(await selectOne("leave_requests", "id", input.leaveRequestId), {
    message: "Leave request not found",
    code: "leave_request_not_found"
  });

  if (!isSuperAdmin(input.actor)) {
    if (input.actor.role !== "admin") {
      throw new HttpError(403, "You cannot update this leave request", "leave_request_update_forbidden");
    }

    const studentId = asString(row.student_id);
    const student = requireData(await selectOne("students", "id", studentId), {
      message: "Student not found",
      code: "student_not_found"
    });

    if (asString(student.school_id) !== input.actor.schoolId) {
      throw new HttpError(403, "You cannot update this leave request", "leave_request_update_forbidden");
    }
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("leave_requests")
    .update({
      status: input.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.leaveRequestId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, error.message, "leave_request_update_failed");
  }

  return mapLeaveRequest(data as RecordMap);
}

async function countRows(table: string, schoolId?: string, filters: Record<string, unknown> = {}) {
  let query = getSupabaseAdminClient()
    .from(table)
    .select("*", { count: "exact", head: true });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { count, error } = await query;

  if (error) {
    throw new HttpError(500, error.message, `count_${table}_failed`);
  }

  return count ?? 0;
}

export async function getDashboardSummary(schoolId?: string): Promise<DashboardSummary> {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

  const [activeTrips, unresolvedAlerts, assignedStudents] = await Promise.all([
    countRows("trips", schoolId, { status: "active" }),
    countRows("alerts", schoolId, { status: "open" }),
    countRows("student_transport_assignments", schoolId, { is_active: true })
  ]);

  // For onboardStudents, we count 'boarded' events for today
  let onboardStudents = 0;
  {
    let query = getSupabaseAdminClient()
      .from("attendance_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "boarded")
      .gte("recorded_at", today);
    
    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }
    
    const { count } = await query;
    onboardStudents = count ?? 0;
  }

  let delayedTrips = 0;
  {
    let query = getSupabaseAdminClient()
      .from("alerts")
      .select("status, type, alert_type");
    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }
    const { data, error } = await query;
    if (error) {
      throw new HttpError(500, error.message, "dashboard_delay_alerts_failed");
    }
    delayedTrips = (data ?? []).filter((row) => {
      const mapped = row as RecordMap;
      const alertType = asString(mapped.alert_type || mapped.type).toLowerCase();
      const status = asString(mapped.status).toLowerCase();
      return alertType === "delay" && status === "open";
    }).length;
  }

  return {
    activeTrips,
    delayedTrips,
    unresolvedAlerts,
    onboardStudents,
    assignedStudents
  };
}

export async function listNightlyPlannerRuns(input: {
  schoolId?: string;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(input.limit ?? 25, 200));
  let query = getSupabaseAdminClient()
    .from("nightly_planner_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (input.schoolId) {
    query = query.eq("school_id", input.schoolId);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message, "nightly_planner_runs_list_failed");
  }

  return (data ?? []).map((row) => mapNightlyPlannerRun(row as RecordMap));
}

const adminCollectionMap = {
  schools: "schools",
  users: "users",
  routes: "routes",
  stops: "stops",
  buses: "buses",
  drivers: "drivers",
  students: "students",
  assignments: "student_transport_assignments"
} as const;

export type AdminResource = keyof typeof adminCollectionMap;

type AdminResourcePayload = Record<string, unknown>;

const adminResourceFieldMap: Record<AdminResource, readonly string[]> = {
  schools: ["name", "address", "latitude", "longitude", "is_active", "school_id", "email", "password"],
  users: ["full_name", "role", "is_active", "school_id", "phone_number", "email"],
  routes: ["route_name", "route_code", "description", "direction", "status", "school_id"],
  stops: ["stop_name", "address", "latitude", "longitude", "route_id", "sequence_order", "school_id", "is_active"],
  buses: ["vehicle_number", "plate", "capacity", "status", "driver_id", "route_id", "gps_device_id", "school_id", "is_active"],
  drivers: ["user_id", "full_name", "phone_number", "email", "license_number", "status", "assigned_bus_id", "school_id", "is_active", "password"],
  students: ["first_name", "last_name", "grade", "class", "section", "roll_number", "pickup_stop_id", "drop_stop_id", "route_id", "assigned_bus_id", "transport_status", "home_address", "latitude", "longitude", "school_id", "is_active", "email", "password"],
  assignments: ["student_id", "route_id", "stop_id", "bus_id", "status", "school_id"]
};

function applyAdminResourceAliases(resource: AdminResource, payload: AdminResourcePayload) {
  const normalized: Record<string, unknown> = { ...payload };

  if (resource === "users") {
    if (normalized.status != null && normalized.is_active == null) {
      const status = asTrimmedString(normalized.status).toLowerCase();
      normalized.is_active = status === "active" || status === "true" || status === "1";
    }
  }

  if (resource === "routes") {
    if (normalized.name != null && normalized.route_name == null) {
      normalized.route_name = normalized.name;
    }
    if (normalized.code != null && normalized.route_code == null) {
      normalized.route_code = normalized.code;
    }
  }

  if (resource === "stops") {
    if (normalized.name != null && normalized.stop_name == null) {
      normalized.stop_name = normalized.name;
    }
  }

  if (resource === "buses") {
    if (normalized.label != null && normalized.vehicle_number == null) {
      normalized.vehicle_number = normalized.label;
    }
    if (normalized.registration_no != null && normalized.vehicle_number == null) {
      normalized.vehicle_number = normalized.registration_no;
    }
  }

  if (resource === "drivers") {
    if (normalized.license_no != null && normalized.license_number == null) {
      normalized.license_number = normalized.license_no;
    }
    if (normalized.status != null && normalized.is_active == null) {
      const status = asTrimmedString(normalized.status).toLowerCase();
      normalized.is_active = status === "active" || status === "true" || status === "1";
    }
  }

  if (resource === "students") {
    if (normalized.address_text != null && normalized.home_address == null) {
      normalized.home_address = normalized.address_text;
    }
    if (normalized.status != null && normalized.transport_status == null) {
      normalized.transport_status = normalized.status;
    }
    if (normalized.full_name != null && (normalized.first_name == null || normalized.last_name == null)) {
      const fullName = asTrimmedString(normalized.full_name);
      if (fullName) {
        const [first, ...rest] = fullName.split(" ");
        normalized.first_name = normalized.first_name ?? first;
        normalized.last_name = normalized.last_name ?? (rest.join(" ") || first);
      }
    }
  }

  return normalized;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeAdminResourcePayload(
  resource: AdminResource,
  payload: AdminResourcePayload,
  schoolId: string | undefined
) {
  const normalizedPayload = applyAdminResourceAliases(resource, payload);
  const allowedFields = adminResourceFieldMap[resource];
  const sanitized: Record<string, unknown> = {};

  for (const field of allowedFields) {
    const value = normalizedPayload[field];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        sanitized[field] = trimmed;
      }
      continue;
    }

    if (value !== undefined && value !== null) {
      sanitized[field] = value;
    }
  }

  if (resource !== "schools") {
    const scopedSchoolId = asTrimmedString(normalizedPayload.school_id) || asTrimmedString(schoolId);
    if (!scopedSchoolId) {
      throw new HttpError(400, "school_id is required", "missing_school_id");
    }

    sanitized.school_id = scopedSchoolId;
  }

  return sanitized;
}

function getAdminTable(resource: AdminResource) {
  return adminCollectionMap[resource];
}

export async function listAdminResources(
  resource: AdminResource,
  schoolId?: string,
  filters: Record<string, string> = {}
) {
  let query = getSupabaseAdminClient()
    .from(getAdminTable(resource))
    .select("*")
    .order("created_at", { ascending: false });

  if (resource !== "schools" && schoolId) {
    query = query.eq("school_id", schoolId);
  }

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, error.message, `${resource}_list_failed`);
  }

  return data ?? [];
}

export async function createAdminResource(resource: AdminResource, schoolId: string | undefined, payload: Record<string, unknown>) {
  const sanitized = sanitizeAdminResourcePayload(resource, payload, schoolId);
  const adminClient = getSupabaseAdminClient();
  
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password.trim() : "";
  const hasAuth = email.length > 0 && password.length > 0;

  let finalPayload: Record<string, unknown> = {
    ...sanitized,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Pre-creation hooks (e.g. creating user for driver first to get user_id)
  if (resource === "drivers" && hasAuth) {
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitized.full_name,
        role: "driver"
      }
    });

    if (authError) {
      throw new HttpError(400, authError.message, "auth_user_create_failed");
    }

    // Insert user record in public.users
    const userRow = {
      id: authUser.user.id,
      school_id: sanitized.school_id,
      role: "driver",
      full_name: sanitized.full_name,
      phone_number: sanitized.phone_number,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: userInsertError } = await adminClient.from("users").insert(userRow);
    if (userInsertError) {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      throw new HttpError(500, userInsertError.message, "user_record_create_failed");
    }

    finalPayload.user_id = authUser.user.id;
  }

  // 2. Main resource creation
  // Strip email/password from insertion payload if they aren't in the DB table
  const insertionPayload = { ...finalPayload };
  delete insertionPayload.email;
  delete insertionPayload.password;

  const { data, error } = await adminClient
    .from(getAdminTable(resource))
    .insert(insertionPayload)
    .select()
    .single();

  if (error) {
    throw new HttpError(500, error.message, `${resource}_create_failed`);
  }

  const resultRow = data as RecordMap;

  // 3. Post-creation hooks
  if (resource === "schools" && hasAuth) {
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${sanitized.name} Admin`,
        role: "admin",
        school_id: resultRow.id
      }
    });

    if (authError) {
      throw new HttpError(400, authError.message, "school_admin_auth_failed");
    }

    await adminClient.from("users").insert({
      id: authUser.user.id,
      school_id: resultRow.id,
      role: "admin",
      full_name: `${sanitized.name} Admin`,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  if (resource === "students" && hasAuth) {
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Parent of ${sanitized.first_name}`,
        role: "parent",
        school_id: sanitized.school_id
      }
    });

    if (!authError) {
      await adminClient.from("users").insert({
        id: authUser.user.id,
        school_id: sanitized.school_id,
        role: "parent",
        full_name: `Parent of ${sanitized.first_name}`,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Link as guardian
      await adminClient.from("student_guardians").insert({
        parent_id: authUser.user.id,
        student_id: resultRow.id,
        created_at: new Date().toISOString()
      });
    }
  }

  // Handle standard user creation (if explicitly creating from users page)
  if (resource === "users" && hasAuth) {
     const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitized.full_name,
        role: sanitized.role
      }
    });

    if (!authError) {
       await adminClient.from("users").update({
         id: authUser.user.id
       }).eq("id", resultRow.id);
    }
  }

  return resultRow;
}

export async function updateAdminResource(
  resource: AdminResource,
  resourceId: string,
  schoolId: string | undefined,
  payload: Record<string, unknown>
) {
  const sanitized = sanitizeAdminResourcePayload(resource, payload, schoolId);
  const basePayload = { ...sanitized };
  delete basePayload.email;
  delete basePayload.password;

  const adminClient = getSupabaseAdminClient();

  // If password change is requested...
  if (typeof payload.password === "string" && (payload.password as string).trim()) {
    let authUserId: string | null = null;
    
    if (resource === "users") {
      authUserId = resourceId;
    } else if (resource === "drivers") {
      const { data: driverRow } = await adminClient.from("drivers").select("user_id").eq("id", resourceId).maybeSingle();
      authUserId = driverRow?.user_id || null;
    } else if (resource === "students") {
       const { data: linkage } = await adminClient.from("student_guardians").select("parent_id").eq("student_id", resourceId).maybeSingle();
       authUserId = linkage?.parent_id || null;
    }

    if (authUserId) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(authUserId, {
        password: payload.password as string
      });

      if (authError) {
        throw new HttpError(400, authError.message, "auth_password_update_failed");
      }
    }
  }

  let query = adminClient
    .from(getAdminTable(resource))
    .update(basePayload)
    .eq("id", resourceId);

  if (resource !== "schools" && schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query.select("*").single();

  if (error) {
    throw new HttpError(500, error.message, `${resource}_update_failed`);
  }

  return data;
}

export async function deleteAdminResource(resource: AdminResource, resourceId: string, schoolId?: string) {
  let query = getSupabaseAdminClient()
    .from(getAdminTable(resource))
    .delete()
    .eq("id", resourceId);

  if (resource !== "schools" && schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { error } = await query;

  if (error) {
    throw new HttpError(500, error.message, `${resource}_delete_failed`);
  }
}

export async function verifySupabaseConnection() {
  const { error } = await getSupabaseAdminClient()
    .from("users")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    throw error;
  }
}
