# Realtime Maps And Routing Guide

## Goal

Provide secure live transport visibility for admin/super admin/parent/driver with resilient ETA updates.

## Realtime Transport Data Paths

- Polling:
  - `GET /maps/events`
- Secure SSE:
  - `GET /maps/events/stream?streamToken=...`
  - no `accessToken` or `userId` query auth allowed

## Stream Token Flow

1. Client calls `POST /auth/stream-token`.
2. API returns short-lived `streamToken` (default 5 minutes).
3. Client connects SSE using only `streamToken`.
4. Client reconnects with `since=<lastEventTime>` after interruptions.

## Reconnect Contract

- Heartbeat from server every 15 seconds.
- Recommended client retry backoff:
  - 1s, 2s, 5s, 10s, then cap at 30s.

## Live Map Endpoints

- School admin:
  - `GET /maps/schools/:schoolId/drivers/live`
- Super admin:
  - `GET /maps/super-admin/drivers/live`

## Routing + ETA Operations

- Geocoding:
  - `POST /students/:studentId/address/geocode`
  - `POST /schools/:schoolId/students/geocode-bulk`
- Planner:
  - `POST /schools/:schoolId/routes/optimize-daily`
- Reoptimization:
  - `POST /trips/:tripId/reoptimize`
  - triggered for `no_show`, `major_delay`, `breakdown`, `reassignment`
- Stop execution:
  - `POST /trips/:tripId/stops/:stopId/arrived`
  - `POST /trips/:tripId/stops/:stopId/boarded`
  - `POST /trips/:tripId/stops/:stopId/no-show`

## Route Engine Audit

- `route_plan_versions.route_engine_mode` values:
  - `google_waypoint`
  - `nearest_neighbor_fallback`

## Reliability + Health

- `GET /health/dependencies` exposes:
  - Supabase status
  - Google Maps status
  - Brevo status

## Implementation References

- Maps routes:
  - `apps/api/src/modules/maps/routes.ts`
- Routing logic:
  - `apps/api/src/lib/map-data.ts`
- Maps integration + dependency status:
  - `apps/api/src/lib/maps.ts`
