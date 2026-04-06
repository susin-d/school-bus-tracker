# Database Schema (Supabase Postgres)

## Core Domain Tables

- `schools`
- `users` (`role` in `parent`, `driver`, `admin`, `super_admin`)
- `students`
- `student_guardians`
- `routes`
- `stops`
- `buses`
- `drivers`
- `student_transport_assignments`
- `trips`
- `trip_students`
- `trip_locations`
- `attendance_events`
- `alerts`
- `leave_requests`

## Routing + Live Ops Tables

- `school_map_settings`
  - includes `dispatch_start_time`, `no_show_wait_seconds`, `max_detour_minutes`
- `trip_stops`
  - ordered stop manifest with status lifecycle and ETA fields
- `route_plan_versions`
  - immutable route snapshots, includes `route_engine_mode`
- `eta_updates`
  - ETA history events
- `nightly_planner_runs`
  - planner execution history, includes status and `error_code`

## Student Geocoding Fields

Stored on `students`:

- `address_text`
- `lat`
- `lng`
- `geocode_status`
- `place_id`
- `last_geocoded_at`
- `geocode_error`

## Key Security Rules (RLS)

RLS is enabled and policies are applied by migrations in `supabase/migrations`.

- Parent:
  - read only linked students/trips/events
- Driver:
  - read/write only assigned trip and scoped operational records
- Admin:
  - manage only own-school resources
- Super admin:
  - cross-school access

## Migration Source Of Truth

- `20260404_role_based_access.sql` - base role model + RLS helpers/policies
- `20260404_map_routing_rls.sql` - map/routing tables + policies
- `20260404_planner_runs_rls.sql` - planner run table + policies
- `20260404_operational_observability.sql` - route engine + planner error audit columns

## Fixture/CI Notes

- deterministic RLS fixture seeding script:
  - `apps/api/src/scripts/seed-rls-fixtures.ts`
- CI job applies migrations and executes real RLS integration tests against staging:
  - `.github/workflows/rls-staging.yml`
