import type {
  AlertListResponse,
  DriversLiveMapResponse,
  DashboardSummary,
  NightlyPlannerRunsResponse,
  OptimizeDailyRoutesResponse,
  RealtimeEventsResponse,
  SchoolMapSettingsResponse,
  StudentGeocodeResponse,
  UpdateSchoolMapSettingsRequest,
  LeaveRequestListResponse
} from "@school-bus/shared";

import type { AdminRequestUser } from "./roleAccess";

type AdminListResponse<T> = {
  items: T[];
};

type RequestOptions = {
  schoolId?: string;
  query?: Record<string, string>;
};

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";
type ResourceKey = "routes" | "stops" | "buses" | "drivers" | "assignments";

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:4000";
}

function buildUrl(path: string, options?: RequestOptions) {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  if (options?.schoolId) {
    url.searchParams.set("schoolId", options.schoolId);
  }

  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function requestJson<T>(
  method: RequestMethod,
  path: string,
  currentUser: AdminRequestUser,
  options?: RequestOptions,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(buildUrl(path, options), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(currentUser.accessToken
        ? { Authorization: `Bearer ${currentUser.accessToken}` }
        : { "x-user-id": currentUser.id })
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error ?? message;
    } catch {
      // Ignore JSON parsing errors for non-JSON failures.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getDashboard(currentUser: AdminRequestUser) {
  return requestJson<DashboardSummary>("GET", "/admin/dashboard", currentUser, {
    schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
  });
}

export function listPlannerRuns(currentUser: AdminRequestUser, limit = 20) {
  return requestJson<NightlyPlannerRunsResponse>("GET", "/admin/planner-runs", currentUser, {
    schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId,
    query: { limit: String(limit) }
  });
}

export function listUsers(currentUser: AdminRequestUser) {
  return requestJson<AdminListResponse<Record<string, unknown>>>("GET", "/admin/users", currentUser, {
    schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
  });
}

export function listSchools(currentUser: AdminRequestUser) {
  return requestJson<AdminListResponse<Record<string, unknown>>>("GET", "/admin/schools", currentUser);
}

export function listStudents(currentUser: AdminRequestUser, schoolId?: string) {
  return requestJson<AdminListResponse<Record<string, unknown>>>("GET", "/admin/students", currentUser, {
    schoolId:
      currentUser.role === "super_admin"
        ? schoolId
        : currentUser.schoolId
  });
}

export function listAlerts(currentUser: AdminRequestUser) {
  return requestJson<AlertListResponse>("GET", "/alerts", currentUser, {
    schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
  });
}

export function listLeaveRequests(currentUser: AdminRequestUser) {
  return requestJson<LeaveRequestListResponse>("GET", "/leave-requests", currentUser, {
    schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
  });
}

export function createSchool(
  currentUser: AdminRequestUser,
  payload: { name: string; timezone: string }
) {
  return requestJson<Record<string, unknown>>(
    "POST",
    "/admin/schools",
    currentUser,
    undefined,
    payload
  );
}

export function deleteSchool(currentUser: AdminRequestUser, schoolId: string) {
  return requestJson<void>("DELETE", `/admin/schools/${schoolId}`, currentUser);
}

export function updateSchool(
  currentUser: AdminRequestUser,
  schoolId: string,
  payload: { name: string; timezone: string }
) {
  return requestJson<Record<string, unknown>>(
    "PUT",
    `/admin/schools/${schoolId}`,
    currentUser,
    undefined,
    payload
  );
}

export function createUser(
  currentUser: AdminRequestUser,
  payload: {
    full_name: string;
    role: string;
    school_id?: string;
    status?: string;
  }
) {
  return requestJson<Record<string, unknown>>(
    "POST",
    "/admin/users",
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    },
    payload
  );
}

export function deleteUser(currentUser: AdminRequestUser, userId: string) {
  return requestJson<void>(
    "DELETE",
    `/admin/users/${userId}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    }
  );
}

export function updateUser(
  currentUser: AdminRequestUser,
  userId: string,
  payload: {
    full_name?: string;
    role?: string;
    school_id?: string;
    status?: string;
  }
) {
  return requestJson<Record<string, unknown>>(
    "PUT",
    `/admin/users/${userId}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    },
    payload
  );
}

export function createStudent(
  currentUser: AdminRequestUser,
  payload: {
    full_name: string;
    grade: string;
    address_text?: string;
    school_id?: string;
  }
) {
  return requestJson<Record<string, unknown>>(
    "POST",
    "/admin/students",
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    },
    payload
  );
}

export function deleteStudent(currentUser: AdminRequestUser, studentId: string) {
  return requestJson<void>(
    "DELETE",
    `/admin/students/${studentId}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    }
  );
}

export function updateStudent(
  currentUser: AdminRequestUser,
  studentId: string,
  payload: {
    full_name?: string;
    grade?: string;
    address_text?: string;
    school_id?: string;
  }
) {
  return requestJson<Record<string, unknown>>(
    "PUT",
    `/admin/students/${studentId}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    },
    payload
  );
}

export function acknowledgeAlert(currentUser: AdminRequestUser, alertId: string) {
  return requestJson<Record<string, unknown>>(
    "POST",
    `/alerts/${alertId}/acknowledge`,
    currentUser
  );
}

export function resolveAlert(
  currentUser: AdminRequestUser,
  alertId: string,
  resolutionNote?: string
) {
  return requestJson<Record<string, unknown>>(
    "POST",
    `/alerts/${alertId}/resolve`,
    currentUser,
    undefined,
    resolutionNote ? { resolutionNote } : {}
  );
}

export function updateLeaveRequestStatus(
  currentUser: AdminRequestUser,
  leaveRequestId: string,
  status: "approved" | "rejected"
) {
  return requestJson<Record<string, unknown>>(
    "POST",
    `/leave-requests/${leaveRequestId}/status`,
    currentUser,
    undefined,
    { status }
  );
}

function listScopedResource(currentUser: AdminRequestUser, resource: ResourceKey) {
  return requestJson<AdminListResponse<Record<string, unknown>>>(
    "GET",
    `/admin/${resource}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    }
  );
}

function createScopedResource(
  currentUser: AdminRequestUser,
  resource: ResourceKey,
  payload: Record<string, unknown>
) {
  return requestJson<Record<string, unknown>>(
    "POST",
    `/admin/${resource}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    },
    payload
  );
}

function updateScopedResource(
  currentUser: AdminRequestUser,
  resource: ResourceKey,
  resourceId: string,
  payload: Record<string, unknown>
) {
  return requestJson<Record<string, unknown>>(
    "PUT",
    `/admin/${resource}/${resourceId}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    },
    payload
  );
}

function deleteScopedResource(
  currentUser: AdminRequestUser,
  resource: ResourceKey,
  resourceId: string
) {
  return requestJson<void>(
    "DELETE",
    `/admin/${resource}/${resourceId}`,
    currentUser,
    {
      schoolId: currentUser.role === "super_admin" ? undefined : currentUser.schoolId
    }
  );
}

export function listRoutes(currentUser: AdminRequestUser) {
  return listScopedResource(currentUser, "routes");
}

export function createRoute(currentUser: AdminRequestUser, payload: Record<string, unknown>) {
  return createScopedResource(currentUser, "routes", payload);
}

export function updateRoute(currentUser: AdminRequestUser, routeId: string, payload: Record<string, unknown>) {
  return updateScopedResource(currentUser, "routes", routeId, payload);
}

export function deleteRoute(currentUser: AdminRequestUser, routeId: string) {
  return deleteScopedResource(currentUser, "routes", routeId);
}

export function listStops(currentUser: AdminRequestUser) {
  return listScopedResource(currentUser, "stops");
}

export function createStop(currentUser: AdminRequestUser, payload: Record<string, unknown>) {
  return createScopedResource(currentUser, "stops", payload);
}

export function updateStop(currentUser: AdminRequestUser, stopId: string, payload: Record<string, unknown>) {
  return updateScopedResource(currentUser, "stops", stopId, payload);
}

export function deleteStop(currentUser: AdminRequestUser, stopId: string) {
  return deleteScopedResource(currentUser, "stops", stopId);
}

export function listBuses(currentUser: AdminRequestUser) {
  return listScopedResource(currentUser, "buses");
}

export function createBus(currentUser: AdminRequestUser, payload: Record<string, unknown>) {
  return createScopedResource(currentUser, "buses", payload);
}

export function updateBus(currentUser: AdminRequestUser, busId: string, payload: Record<string, unknown>) {
  return updateScopedResource(currentUser, "buses", busId, payload);
}

export function deleteBus(currentUser: AdminRequestUser, busId: string) {
  return deleteScopedResource(currentUser, "buses", busId);
}

export function listDrivers(currentUser: AdminRequestUser) {
  return listScopedResource(currentUser, "drivers");
}

export function createDriver(currentUser: AdminRequestUser, payload: Record<string, unknown>) {
  return createScopedResource(currentUser, "drivers", payload);
}

export function updateDriver(currentUser: AdminRequestUser, driverId: string, payload: Record<string, unknown>) {
  return updateScopedResource(currentUser, "drivers", driverId, payload);
}

export function deleteDriver(currentUser: AdminRequestUser, driverId: string) {
  return deleteScopedResource(currentUser, "drivers", driverId);
}

export function listAssignments(currentUser: AdminRequestUser) {
  return listScopedResource(currentUser, "assignments");
}

export function createAssignment(currentUser: AdminRequestUser, payload: Record<string, unknown>) {
  return createScopedResource(currentUser, "assignments", payload);
}

export function updateAssignment(currentUser: AdminRequestUser, assignmentId: string, payload: Record<string, unknown>) {
  return updateScopedResource(currentUser, "assignments", assignmentId, payload);
}

export function deleteAssignment(currentUser: AdminRequestUser, assignmentId: string) {
  return deleteScopedResource(currentUser, "assignments", assignmentId);
}

export function geocodeStudentAddress(
  currentUser: AdminRequestUser,
  studentId: string,
  addressText?: string
) {
  return requestJson<StudentGeocodeResponse>(
    "POST",
    `/students/${studentId}/address/geocode`,
    currentUser,
    undefined,
    addressText?.trim() ? { addressText: addressText.trim() } : {}
  );
}

export function bulkGeocodeStudentsBySchool(
  currentUser: AdminRequestUser,
  schoolId: string,
  forceRefresh = false
) {
  return requestJson<{
    schoolId: string;
    totalStudents: number;
    successCount: number;
    failureCount: number;
    results: StudentGeocodeResponse[];
  }>(
    "POST",
    `/schools/${schoolId}/students/geocode-bulk`,
    currentUser,
    undefined,
    { forceRefresh }
  );
}

export function optimizeSchoolRoutesDaily(
  currentUser: AdminRequestUser,
  schoolId: string,
  options?: { dispatchAt?: string; reason?: string }
) {
  return requestJson<OptimizeDailyRoutesResponse>(
    "POST",
    `/schools/${schoolId}/routes/optimize-daily`,
    currentUser,
    undefined,
    {
      dispatchAt: options?.dispatchAt,
      reason: options?.reason
    }
  );
}

export function listLiveDriversMap(
  currentUser: AdminRequestUser,
  schoolId?: string
) {
  if (currentUser.role === "super_admin" && !schoolId) {
    return requestJson<DriversLiveMapResponse>(
      "GET",
      "/maps/super-admin/drivers/live",
      currentUser
    );
  }

  const resolvedSchoolId = schoolId ?? currentUser.schoolId;
  if (!resolvedSchoolId) {
    throw new Error("schoolId is required to fetch school driver map.");
  }

  return requestJson<DriversLiveMapResponse>(
    "GET",
    `/maps/schools/${resolvedSchoolId}/drivers/live`,
    currentUser
  );
}

export function listRealtimeMapEvents(
  currentUser: AdminRequestUser,
  options?: { schoolId?: string; tripId?: string; since?: string }
) {
  return requestJson<RealtimeEventsResponse>(
    "GET",
    "/maps/events",
    currentUser,
    {
      query: {
        ...(options?.schoolId ? { schoolId: options.schoolId } : {}),
        ...(options?.tripId ? { tripId: options.tripId } : {}),
        ...(options?.since ? { since: options.since } : {})
      }
    }
  );
}

export function createStreamToken(
  currentUser: AdminRequestUser,
  options?: { schoolId?: string; tripId?: string }
) {
  return requestJson<{ streamToken: string; expiresAt: string }>(
    "POST",
    "/auth/stream-token",
    currentUser,
    undefined,
    {
      schoolId: options?.schoolId,
      tripId: options?.tripId
    }
  );
}

export function getSchoolMapSettings(
  currentUser: AdminRequestUser,
  schoolId: string
) {
  return requestJson<SchoolMapSettingsResponse>(
    "GET",
    `/schools/${schoolId}/map-settings`,
    currentUser
  );
}

export function updateSchoolMapSettings(
  currentUser: AdminRequestUser,
  schoolId: string,
  payload: UpdateSchoolMapSettingsRequest
) {
  return requestJson<SchoolMapSettingsResponse>(
    "PUT",
    `/schools/${schoolId}/map-settings`,
    currentUser,
    undefined,
    payload as Record<string, unknown>
  );
}

export function sendAdminMail(
  currentUser: AdminRequestUser,
  payload: {
    mode: "all_students" | "selected_students" | "emails" | "users";
    schoolId?: string;
    studentIds?: string[];
    emails?: string[];
    userIds?: string[];
    subject: string;
    message: string;
  }
) {
  return requestJson<{
    ok: boolean;
    mode: string;
    recipientCount: number;
  }>(
    "POST",
    "/admin/mail/send",
    currentUser,
    undefined,
    payload as Record<string, unknown>
  );
}
