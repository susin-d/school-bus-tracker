export type ApiRole = "admin" | "super_admin";

export interface ApiUserProfile {
  id: string;
  schoolId: string;
  role: ApiRole;
  fullName: string;
  email?: string;
}

export interface ApiLiveDriverMapItem {
  tripId: string;
  schoolId: string;
  schoolName?: string;
  driverId?: string;
  driverName?: string;
  busLabel?: string;
  routeName?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speedKph?: number;
  locationRecordedAt?: string;
  nextStopName?: string;
  nextStopEta?: string;
  etaDelayMinutes?: number;
  isDelayed: boolean;
}

export interface ApiSchoolDispatchLocation {
  schoolId: string;
  schoolName?: string;
  latitude: number;
  longitude: number;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export type AdminResource =
  | "schools"
  | "students"
  | "drivers"
  | "buses"
  | "assignments";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:4000").replace(/\/$/, "");

const AUTH_TOKEN_KEY = "schoolbus.admin.token";

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value.length > 0) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.error || payload.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

export async function requestApi<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
  query?: Record<string, string | undefined>
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function loginWithEmail(email: string, password: string) {
  return requestApi<{ token: string; user: ApiUserProfile }>("/auth/email-login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getCurrentUser(token: string) {
  const result = await requestApi<{ user: ApiUserProfile }>("/auth/me", { method: "GET" }, token);
  return result.user;
}

export async function logoutSession(token?: string) {
  await requestApi<{ success: boolean }>("/auth/logout", { method: "POST" }, token);
}

export async function listAdminResource<T>(
  resource: AdminResource,
  token: string,
  query?: Record<string, string | undefined>
) {
  const result = await requestApi<{ items: T[] }>(`/admin/${resource}`, { method: "GET" }, token, query);
  return result.items;
}

export async function createAdminResource<T>(
  resource: AdminResource,
  token: string,
  payload: Record<string, unknown>
) {
  return requestApi<T>(`/admin/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
}

export async function updateAdminResource<T>(
  resource: AdminResource,
  resourceId: string,
  token: string,
  payload: Record<string, unknown>
) {
  return requestApi<T>(`/admin/${resource}/${resourceId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  }, token);
}

export async function deleteAdminResource(resource: AdminResource, resourceId: string, token: string) {
  await requestApi<void>(`/admin/${resource}/${resourceId}`, { method: "DELETE" }, token);
}

export async function sendAdminAnnouncement(
  token: string,
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
  return requestApi<{ success: boolean }>("/admin/mail/send", {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
}

export async function listLiveDrivers(token: string, schoolId: string) {
  const result = await requestApi<{ drivers: ApiLiveDriverMapItem[] }>(
    `/maps/schools/${schoolId}/drivers/live`,
    { method: "GET" },
    token
  );
  return result.drivers;
}

export async function listSchoolDispatchLocations(token: string, schoolId?: string) {
  const result = await requestApi<{ schools: ApiSchoolDispatchLocation[] }>(
    "/maps/schools/dispatch-locations",
    { method: "GET" },
    token,
    { schoolId }
  );
  return result.schools;
}
