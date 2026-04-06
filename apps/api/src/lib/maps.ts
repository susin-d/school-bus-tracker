import type { GeocodeStatus } from "@school-bus/shared";

import { HttpError } from "./http.js";

export type LatLng = {
  latitude: number;
  longitude: number;
};

type GeocodeResult = {
  geocodeStatus: GeocodeStatus;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  formattedAddress?: string;
  error?: string;
};

type DependencyStatus = {
  provider: "google_maps";
  configured: boolean;
  lastStatus: "ok" | "error" | "unknown";
  lastError?: string;
  lastCheckedAt?: string;
};

const googleMapsDependencyStatus: DependencyStatus = {
  provider: "google_maps",
  configured: false,
  lastStatus: "unknown"
};

function markGoogleDependency(status: "ok" | "error", error?: string) {
  googleMapsDependencyStatus.configured = Boolean(readGoogleApiKey());
  googleMapsDependencyStatus.lastStatus = status;
  googleMapsDependencyStatus.lastError = error;
  googleMapsDependencyStatus.lastCheckedAt = new Date().toISOString();
}

export function getGoogleMapsDependencyStatus(): DependencyStatus {
  return {
    ...googleMapsDependencyStatus,
    configured: Boolean(readGoogleApiKey())
  };
}

function readGoogleApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || "";
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(origin: LatLng, destination: LatLng) {
  const earthRadiusKm = 6371;
  const deltaLat = toRad(destination.latitude - origin.latitude);
  const deltaLng = toRad(destination.longitude - origin.longitude);
  const lat1 = toRad(origin.latitude);
  const lat2 = toRad(destination.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function fallbackTravelSeconds(origin: LatLng, destination: LatLng) {
  const distanceKm = haversineDistanceKm(origin, destination);
  const speedKph = 28;
  return Math.max(120, Math.round((distanceKm / speedKph) * 3600));
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidLatLng(value: Partial<LatLng> | null | undefined): value is LatLng {
  return Boolean(
    value &&
      isFiniteCoordinate(value.latitude) &&
      isFiniteCoordinate(value.longitude) &&
      Math.abs(value.latitude) <= 90 &&
      Math.abs(value.longitude) <= 180
  );
}

export async function geocodeAddress(addressText: string): Promise<GeocodeResult> {
  const trimmed = addressText.trim();
  if (!trimmed) {
    return {
      geocodeStatus: "failed",
      error: "Address is empty"
    };
  }

  const apiKey = readGoogleApiKey();
  if (!apiKey) {
    markGoogleDependency("error", "GOOGLE_MAPS_API_KEY is not configured");
    return {
      geocodeStatus: "failed",
      error: "GOOGLE_MAPS_API_KEY is not configured"
    };
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  endpoint.searchParams.set("address", trimmed);
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint);
  if (!response.ok) {
    markGoogleDependency("error", `geocode_http_${response.status}`);
    throw new HttpError(
      502,
      `Google geocoding request failed with status ${response.status}`,
      "google_geocode_failed"
    );
  }

  const payload = (await response.json()) as {
    status?: string;
    error_message?: string;
    results?: Array<{
      formatted_address?: string;
      place_id?: string;
      geometry?: {
        location?: {
          lat?: number;
          lng?: number;
        };
      };
    }>;
  };

  if (payload.status !== "OK" || !payload.results?.length) {
    markGoogleDependency("error", payload.error_message || payload.status || "geocode_failed");
    return {
      geocodeStatus: "failed",
      error: payload.error_message || payload.status || "Address could not be geocoded"
    };
  }

  const top = payload.results[0];
  const latitude = top?.geometry?.location?.lat;
  const longitude = top?.geometry?.location?.lng;

  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    markGoogleDependency("error", "geocode_missing_coordinates");
    return {
      geocodeStatus: "failed",
      error: "Geocoding result did not include valid coordinates"
    };
  }

  markGoogleDependency("ok");

  return {
    geocodeStatus: "resolved",
    latitude,
    longitude,
    placeId: top.place_id,
    formattedAddress: top.formatted_address
  };
}

export async function estimateTravelSeconds(
  origin: LatLng,
  destination: LatLng,
  departureAtIso: string
) {
  if (!isValidLatLng(origin) || !isValidLatLng(destination)) {
    return fallbackTravelSeconds(origin, destination);
  }

  const apiKey = readGoogleApiKey();
  if (!apiKey) {
    markGoogleDependency("error", "GOOGLE_MAPS_API_KEY is not configured");
    return fallbackTravelSeconds(origin, destination);
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  endpoint.searchParams.set("origins", `${origin.latitude},${origin.longitude}`);
  endpoint.searchParams.set("destinations", `${destination.latitude},${destination.longitude}`);
  const departureTimestampMs = Date.parse(departureAtIso);
  const departureParam =
    Number.isFinite(departureTimestampMs) && departureTimestampMs > Date.now()
      ? String(Math.floor(departureTimestampMs / 1000))
      : "now";
  endpoint.searchParams.set("departure_time", departureParam);
  endpoint.searchParams.set("traffic_model", "best_guess");
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      markGoogleDependency("error", `distancematrix_http_${response.status}`);
      return fallbackTravelSeconds(origin, destination);
    }

    const payload = (await response.json()) as {
      status?: string;
      rows?: Array<{
        elements?: Array<{
          status?: string;
          duration?: { value?: number };
          duration_in_traffic?: { value?: number };
        }>;
      }>;
    };

    const element = payload.rows?.[0]?.elements?.[0];
    const trafficSeconds = element?.duration_in_traffic?.value;
    const durationSeconds = element?.duration?.value;
    if (typeof trafficSeconds === "number" && Number.isFinite(trafficSeconds)) {
      markGoogleDependency("ok");
      return trafficSeconds;
    }

    if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds)) {
      markGoogleDependency("ok");
      return durationSeconds;
    }

    markGoogleDependency("error", "distancematrix_missing_duration");
    return fallbackTravelSeconds(origin, destination);
  } catch {
    markGoogleDependency("error", "distancematrix_network_error");
    return fallbackTravelSeconds(origin, destination);
  }
}

export function nearestNeighborOrder<T extends LatLng>(origin: LatLng, points: T[]) {
  const remaining = [...points];
  const ordered: T[] = [];
  let cursor = origin;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const distance = haversineDistanceKm(cursor, remaining[index]!);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const [next] = remaining.splice(nearestIndex, 1);
    if (next) {
      ordered.push(next);
      cursor = next;
    }
  }

  return ordered;
}

export async function optimizeWaypointOrder<T extends LatLng>(origin: LatLng, points: T[]) {
  if (points.length <= 1) {
    return {
      points: [...points],
      mode: "nearest_neighbor_fallback" as const
    };
  }

  // Google Directions optimize:true has waypoint limits, keep a safe threshold.
  if (points.length > 23 || !isValidLatLng(origin)) {
    return {
      points: nearestNeighborOrder(origin, points),
      mode: "nearest_neighbor_fallback" as const
    };
  }

  const apiKey = readGoogleApiKey();
  if (!apiKey) {
    markGoogleDependency("error", "GOOGLE_MAPS_API_KEY is not configured");
    return {
      points: nearestNeighborOrder(origin, points),
      mode: "nearest_neighbor_fallback" as const
    };
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/directions/json");
  endpoint.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  endpoint.searchParams.set("destination", `${origin.latitude},${origin.longitude}`);
  endpoint.searchParams.set(
    "waypoints",
    `optimize:true|${points.map((point) => `${point.latitude},${point.longitude}`).join("|")}`
  );
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      markGoogleDependency("error", `directions_http_${response.status}`);
      return {
        points: nearestNeighborOrder(origin, points),
        mode: "nearest_neighbor_fallback" as const
      };
    }

    const payload = (await response.json()) as {
      status?: string;
      routes?: Array<{
        waypoint_order?: number[];
      }>;
    };

    const order = payload.routes?.[0]?.waypoint_order;
    if (!order?.length || order.length !== points.length) {
      markGoogleDependency("error", `directions_status_${payload.status ?? "unknown"}`);
      return {
        points: nearestNeighborOrder(origin, points),
        mode: "nearest_neighbor_fallback" as const
      };
    }

    const optimized = order
      .map((index) => points[index])
      .filter((point): point is T => point != null);
    const result = optimized.length === points.length ? optimized : nearestNeighborOrder(origin, points);
    markGoogleDependency("ok");
    return {
      points: result,
      mode: "google_waypoint" as const
    };
  } catch {
    markGoogleDependency("error", "directions_network_error");
    return {
      points: nearestNeighborOrder(origin, points),
      mode: "nearest_neighbor_fallback" as const
    };
  }
}

export function addSeconds(isoString: string, seconds: number) {
  const base = Date.parse(isoString);
  const baseMs = Number.isFinite(base) ? base : Date.now();
  return new Date(baseMs + seconds * 1000).toISOString();
}
