# Frontend Integration Guide

## Goal

Keep all frontend apps role-safe and backend-driven for auth, data, and realtime.

## App Surfaces

- `apps/admin-web`
  - role: `admin`, `super_admin`
  - auth via backend (`/auth/email-login`)
- `apps/mobile`
  - role: `parent`
  - parent-safe endpoints only
- `apps/driver-mobile`
  - role: `driver`
  - assigned-trip endpoints only

## Admin Web Integration Rules

- Do not call Supabase directly from frontend auth.
- Use backend endpoints for sign in/session:
  - `POST /auth/email-login`
  - `GET /auth/me`
  - `POST /auth/logout`
- Use stream token flow for live map SSE:
  - `POST /auth/stream-token`
  - `GET /maps/events/stream?streamToken=...`

## Parent App Rules

- Allowed:
  - current trip
  - child-scoped live trip
  - attendance history
  - leave requests
  - parent-safe alert feed
- Not allowed:
  - trip status write
  - attendance write
  - admin resources

## Driver App Rules

- Allowed:
  - trip lifecycle actions
  - location heartbeat
  - stop actions (`arrived/boarded/no-show`)
  - incident reporting and reassignment flow support
- Not allowed:
  - global/school admin CRUD
  - other school/driver trip access

## Testing Checklist

- Admin web typecheck:
  - `corepack pnpm --filter @school-bus/admin-web typecheck`
- Parent app:
  - `flutter analyze` and `flutter test` in `apps/mobile`
- Driver app:
  - `flutter analyze` and `flutter test` in `apps/driver-mobile`
- API contracts:
  - `corepack pnpm --filter @school-bus/api test`

## Contract Drift Prevention

- Update `packages/shared` types first when API payload changes.
- Keep frontend endpoint maps aligned with backend role guards.
- Re-run integration tests after any role or scope change.
