# System Architecture

## Current High-Level Architecture

- `apps/api` - Node.js + Express + TypeScript backend (business logic, role enforcement, integrations)
- `apps/admin-web` - React web app for school admin and super admin
- `apps/parents-app` - Flutter parent app
- `apps/driver-mobile` - Flutter driver app
- `packages/shared` - shared TS contracts and domain types
- `supabase/` - SQL migrations and RLS policies

## Identity And Auth

- Supabase Auth is the identity provider.
- Clients authenticate through backend endpoints.
- Admin web no longer uses direct Supabase client auth in browser.
- Backend resolves user profile and role from `users` table (`parent`, `driver`, `admin`, `super_admin`).

## Authorization Model

- API middleware enforces role and school scope.
- Supabase RLS mirrors the same rules at database level.
- Effective model is defense-in-depth:
  - API denies unauthorized calls early.
  - DB still blocks forbidden reads/writes if API path is bypassed.

## Realtime And Maps

- Realtime transport events use polling + SSE.
- Polling endpoint: `GET /maps/events`.
- Secure SSE endpoint: `GET /maps/events/stream?streamToken=...`.
- Stream token is short-lived and issued by `POST /auth/stream-token`.
- Driver app sends location heartbeat every 10 seconds.
- Routing supports baseline optimization + event-driven reoptimization.

## Routing Engine

- Google Maps Platform is primary route/ETA provider.
- Fallback engine uses nearest-neighbor when Google is unavailable.
- Route plan versions store `route_engine_mode` for audit.
- Planner and reoptimization runs are logged with standardized reason/error fields.

## External Integrations

- Supabase: database + auth
- Google Maps Platform: geocode, route ordering, ETA
- Brevo: forgot-password, verification, welcome email delivery

## Operational Observability

- Health:
  - `GET /health`
  - `GET /health/dependencies` (Supabase, Google Maps, Brevo status)
- Structured logs for reoptimization triggers:
  - `absent`
  - `no_show`
  - `major_delay`
  - `breakdown`
  - `reassignment`

