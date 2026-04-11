# API Specification (Current)

## Auth

- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `POST /auth/email-login` (admin web backend-mediated sign-in)
- `POST /auth/session`
- `POST /auth/logout`
- `POST /auth/forgot-password` (Brevo email delivery)
- `POST /auth/forgot-password/parent-otp/send` (parent-only email OTP reset request via Brevo)
- `POST /auth/forgot-password/parent-otp/verify` (verify OTP + set new password)
- `POST /auth/email/send-verification` (verification + welcome email)
- `GET /auth/me`
- `POST /auth/stream-token` (short-lived token for secure SSE map stream)

## Health

- `GET /health`
- `GET /health/dependencies`
  - Supabase connectivity
  - Google Maps status
  - Brevo status

## Trips

- `GET /trips/current`
- `GET /trips/:tripId/location`
- `GET /trips/:tripId/manifest`
- `POST /trips/:tripId/start`
- `POST /trips/:tripId/end`
- `POST /trips/:tripId/status`
- `POST /trips/:tripId/location`
- `POST /trips/:tripId/reoptimize`
- `POST /trips/:tripId/incidents/major-delay`
- `POST /trips/:tripId/incidents/breakdown`
- `POST /trips/:tripId/reassign-driver`
- `POST /trips/:tripId/stops/:stopId/arrived`
- `POST /trips/:tripId/stops/:stopId/boarded`
- `POST /trips/:tripId/stops/:stopId/no-show`

## Attendance

- `GET /attendance/:tripId`
- `GET /attendance/students/:studentId/history`
- `POST /attendance/board`
- `POST /attendance/drop`
- `POST /attendance/:tripId` (generic attendance event write)

## Alerts

- `GET /alerts` (admin/super_admin)
- `GET /alerts/feed` (role-scoped feed)
- `POST /alerts/sos`
- `POST /alerts/delay`
- `POST /alerts/:alertId/acknowledge`
- `POST /alerts/:alertId/resolve`

## Leave Requests

- `GET /leave-requests`
- `POST /leave-requests`
- `POST /leave-requests/:leaveRequestId/status`

## Maps + Realtime

- `GET /maps/events` (polling fallback)
- `GET /maps/events/stream?streamToken=...` (secure SSE; query auth removed)
- `GET /maps/schools/:schoolId/drivers/live`
- `GET /maps/super-admin/drivers/live`
- `GET /maps/drivers/live`

## Parent Live API

- `GET /parents/students/:studentId/live-trip`

## School Routing APIs

- `POST /schools/:schoolId/students/geocode-bulk`
- `POST /schools/:schoolId/routes/optimize-daily`
- `GET /schools/:schoolId/map-settings`
- `PUT /schools/:schoolId/map-settings`

## Student APIs

- `GET /students`
- `POST /students`
- `PUT /students/:studentId`
- `DELETE /students/:studentId`
- `POST /students/:studentId/address/geocode`
- `GET /students/:studentId/attendance`
- `GET /students/:studentId/history`

## Admin APIs

- `GET /admin/dashboard`
- `GET /admin/planner-runs`
- `POST /admin/mail/send`
- generic resource paths:
  - `GET /admin/:resource`
  - `POST /admin/:resource`
  - `PUT /admin/:resource/:resourceId`
  - `DELETE /admin/:resource/:resourceId`

## Resource CRUD Aliases

- `/schools`
- `/users`
- `/routes`
- `/stops`
- `/buses`
- `/drivers`
- `/assignments`

## Auth Header Model

- Session token flows use `Authorization: Bearer <token>`.
- Dev/preview mode currently supports `x-user-id` for local workflows.
- Role + school scope are enforced in both:
  - API middleware/business checks
  - Supabase RLS policies

## Backward Compatibility & Schema Migration (April 2026)

### Field Aliasing for Seamless Migration

The backend automatically normalizes old field names to new canonical schema names. Clients can use either naming convention during the migration period.

**Driver Field Aliases**
- `license_no` → `license_number`
- `status` → `is_active` (string to boolean conversion)

**Student Field Aliases**
- `address_text` → `home_address`
- `status` → `transport_status`
- `full_name` → `first_name` + `last_name` (auto-split)
- `lat`/`lng` → `latitude`/`longitude`

**Route Field Aliases**
- `name` → `route_name`
- `code` → `route_code`

**Stop Field Aliases**
- `name` → `stop_name`

**Bus Field Aliases**
- `label` → `bus_number`
- `registration_no` → `vehicle_number`

**User Field Aliases**
- `status` → `is_active` (string to boolean conversion)

**School Field Aliases**
- `timezone` → `address`

### Response Parsing Strategy

Mobile apps and client code should handle both old and new field names in API responses:
```typescript
// Fallback pattern for field access
const fullName = response.full_name ?? response.fullName;
const address = response.home_address ?? response.address_text;
const latitude = response.latitude ?? response.lat;
```

All API responses maintain backward compatibility - old field names will continue to appear during the migration period.
