# SchoolBus Bridge

Monorepo scaffold for the SchoolBus Bridge platform.

## Apps

- `apps/api` - Node.js + Express API for auth, trips, attendance, alerts, and admin operations
- `apps/admin-web` - React admin dashboard
- `apps/mobile` - Flutter app for parent and driver roles
- `apps/driver-mobile` - Flutter app dedicated to driver operations
- `packages/shared` - shared TypeScript domain types for backend and web

## Workspace Commands

- `npm run dev:api`
- `npm run dev:admin`
- `flutter run` from `apps/mobile`
- `flutter run` from `apps/driver-mobile`
- `npm run typecheck`
- `npm run build`

## Current State

This is the initial scaffold aligned with the docs in `docs/`.
The mobile app now targets Flutter, while the backend is Node.js and Supabase-backed.
Route planning supports both:
- Manual dispatch trigger: `POST /schools/:schoolId/routes/optimize-daily`
- Automatic nightly scheduler in API (`NIGHTLY_PLANNER_*` env vars)
- Planner run history API: `GET /admin/planner-runs` (school admin scoped, super admin global)
- School map settings API: `GET/PUT /schools/:schoolId/map-settings`
- Trip incident APIs:
  - `POST /trips/:tripId/incidents/major-delay`
  - `POST /trips/:tripId/incidents/breakdown`
  - `POST /trips/:tripId/reassign-driver`
- Realtime map feed:
  - Polling: `GET /maps/events`
  - SSE stream: `GET /maps/events/stream`
    - Requires short-lived `streamToken` from `POST /auth/stream-token` (TTL 5 minutes).
    - Admin web consumes SSE with reconnect + polling fallback.
- Dependency health endpoint: `GET /health/dependencies` (Supabase, Google Maps, Brevo status)
- Admin web auth (backend-mediated):
  - `POST /auth/email-login`
  - `POST /auth/logout`
- Admin broadcast mail:
  - `POST /admin/mail/send`
  - school admin: all students / selected students (guardian emails, own school only)
  - super admin: all students / selected students / direct emails / user ids
- Parent forgot-password with email OTP (Brevo):
  - `POST /auth/forgot-password/parent-otp/send`
  - `POST /auth/forgot-password/parent-otp/verify`

## RLS Integration Tests

`apps/api/tests/rls.integration.test.ts` runs real Supabase RLS checks when the following env vars are set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `RLS_PARENT_TOKEN`
- `RLS_DRIVER_TOKEN`
- `RLS_ADMIN_TOKEN`
- `RLS_SUPER_ADMIN_TOKEN`
- `RLS_PARENT_STUDENT_ID`
- `RLS_OTHER_STUDENT_ID`
- `RLS_DRIVER_TRIP_ID`
- `RLS_OTHER_TRIP_ID`
- `RLS_ADMIN_SCHOOL_ID`
- `RLS_OTHER_SCHOOL_ID`

CI enforcement:
- Staging pipeline: `.github/workflows/rls-staging.yml`
- Seeds deterministic fixtures + tokens via:
  - `npm run -w @school-bus/api rls:seed`
- Runs mandatory RLS suite:
  - `npm run -w @school-bus/api test:rls`
  - In CI, missing RLS env now fails the run instead of skipping.

## Additional Env (Password Reset OTP)

- `PARENT_RESET_OTP_SECRET` (recommended; falls back to `STREAM_TOKEN_SECRET` if omitted)
