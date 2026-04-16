// Route optimization logic for bus routes
// This is a placeholder for a simple nearest-neighbor route optimizer
import type { StudentSummary } from "@school-bus/shared";

export interface RouteStop {
  studentId: string;
  latitude: number;
  longitude: number;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
}

// Simple nearest-neighbor route optimizer (placeholder)
export function optimizeRoute(students: StudentSummary[], schoolLat: number, schoolLng: number): OptimizedRoute {
  const stops: RouteStop[] = students.map(s => ({
    studentId: s.id,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude)
  })).filter(s => !isNaN(s.latitude) && !isNaN(s.longitude));

  // Naive: start at school, visit nearest unvisited stop
  const route: RouteStop[] = [];
  let currentLat = schoolLat;
  let currentLng = schoolLng;
  const unvisited = [...stops];
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let minIdx = 0;
    let minDist = distance(currentLat, currentLng, unvisited[0].latitude, unvisited[0].longitude);
    for (let i = 1; i < unvisited.length; i++) {
      const d = distance(currentLat, currentLng, unvisited[i].latitude, unvisited[i].longitude);
      if (d < minDist) {
        minDist = d;
        minIdx = i;
      }
    }
    const next = unvisited.splice(minIdx, 1)[0];
    route.push(next);
    totalDistance += minDist;
    currentLat = next.latitude;
    currentLng = next.longitude;
  }

  // Return to school
  totalDistance += distance(currentLat, currentLng, schoolLat, schoolLng);

  return { stops: route, totalDistance };
}

function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula (approximate, in km)
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
