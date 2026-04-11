# SURAKSHA

Monorepo scaffold for the SURAKSHA platform.

## Apps

- `apps/api` - Node.js + Express API for auth, trips, attendance, alerts, and admin operations
- `apps/admin-web` - React admin dashboard
- `apps/parents-app` - Flutter app for parent and driver roles
- `apps/driver-mobile` - Flutter app dedicated to driver operations
- `packages/shared` - shared TypeScript domain types for backend and web

## Workspace Commands

- `npm run dev:api`
- `npm run dev:admin`
- `flutter run` from `apps/parents-app`
- `flutter run` from `apps/driver-mobile`
- `npm run typecheck`
- `npm run build`

## Current State (April 2026)

### ✅ Implementation Milestones Complete

**Milestone 0-5**: Core infrastructure, identity, trip lifecycle, attendance, admin operations, and security hardening all implemented and tested.

### 🎯 Key Features Implemented

**Transport Management Schema**
- ✅ Extended drivers table: full_name, phone_number, license_number, license_type, police_verification_status, employee status, medical info, emergency contacts, assigned bus, GPS coordinates
- ✅ Extended students table: first_name/last_name, home_address, pickup/drop stops, route assignment, transport status, GPS coordinates, RFID/QR codes
- ✅ Extended buses table: bus_number, vehicle_number, capacity, driver assignment, route assignment, GPS device ID
- ✅ Extended routes table: route_name, route_code, direction, description, status
- ✅ Extended stops table: stop_name, address, coordinates, sequence order, route assignment
- ✅ New parents table: direct student links, notification preferences
- ✅ New trip_logs table: boarding/drop tracking with timestamps
- ✅ Comprehensive enums for status tracking across domain

**Backend API (32 Endpoints)**
- ✅ Auth: OTP, email-login, password reset, verification
- ✅ Trip Management: start, end, status, location, reoptimization
- ✅ Trip Incidents: major-delay, breakdown, reassign-driver
- ✅ Stop Management: arrived, boarded, no-show tracking
- ✅ Attendance: board, drop, history
- ✅ Alerts: SOS, delay, feed, acknowledge, resolve
- ✅ Parent APIs: live trip tracking, student history, leave requests
- ✅ Admin Resources: CRUD for drivers, students, buses, routes, stops, users, schools
- ✅ Realtime: SSE event stream, polling fallback, secure stream tokens
- ✅ Maps: Live driver locations, route optimization, geocoding

**Mobile Apps**
- ✅ Driver App: Full trip lifecycle, location tracking, attendance recording, incident reporting
- ✅ Parent App: Live trip tracking, leave request submission, notification feed
- ✅ Development tools removed - production ready
- ✅ 32 total endpoints verified and fully mapped

**Admin Web**
- ✅ Dashboard with active trips and alert summary
- ✅ Resource management (drivers, students, buses, routes, stops, users, schools, assignments)
- ✅ Nightly route planner integration with history
- ✅ Broadcast email system
- ✅ School map settings management
- ✅ Field alias support for backward compatibility during schema migration

**Security & Testing**
- ✅ Row-Level Security (RLS) on all tables with role-based policies
- ✅ Backend field alias normalization for seamless schema migration
- ✅ Backward-compatible API responses
- ✅ Stream token authentication for secure realtime
- ✅ Full integration test coverage

### 📚 Documentation
- ✅ API Endpoint Reference (MOBILE_API_ENDPOINTS.md)
- ✅ Endpoint Validation Checklist (ENDPOINT_VALIDATION.md)
- ✅ TypeScript Response Types (docs/mobile-api-types.ts)
- ✅ Complete implementation guide
- ✅ Database schema documentation with RLS rules
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
