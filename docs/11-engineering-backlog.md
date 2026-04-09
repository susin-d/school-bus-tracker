# Engineering Backlog

## Platform Setup

- Create npm workspaces for `apps/api`, `apps/admin-web`, and `packages/shared`
- Create Flutter project structure in `apps/parents-app`
- Add environment loading strategy per app
- Add base lint and formatting config

## Shared Contracts

- Define `Role`, `TripStatus`, `AlertType`, `AttendanceEventType`
- Create Zod schemas for auth, trip, attendance, and alerts APIs
- Create shared DTOs for student summaries, trip cards, and notifications

## API Tasks

### Auth Module

- Implement Supabase OTP verification exchange
- Implement backend email login for admin web
- Implement user lookup in Supabase `users` table
- Add backend session/token validation helpers
- Add auth middleware and role guards

### Trips Module

- Create Supabase repositories for trips and locations
- Implement `startTrip`
- Implement `endTrip`
- Implement location ingestion with freshness logic
- Publish realtime events to subscribers (polling + secure SSE)

### Attendance Module

- Implement boarding validation rules
- Implement drop-off validation rules
- Add manual override pathway with audit logging
- Trigger notifications on state changes

### Alerts Module

- Implement SOS alert creation
- Implement delay reporting
- Implement alert acknowledgement and resolution
- Add unresolved critical alert escalations

### Admin Module

- CRUD for routes, buses, drivers, and students
- Assignment management for students and drivers
- Dashboard aggregate queries
- Attendance and trip reports

## Flutter Mobile Tasks

### Shared Mobile Foundation

- Set up app routing and auth state handling
- Add role-based home flow
- Add push notification registration
- Add offline cache strategy

### Parent Flows

- Build parent home live map
- Build notifications inbox
- Build leave request form
- Build trip history list and detail

### Driver Flows

- Build today's assignment screen
- Build trip console
- Build attendance scanner and manual entry flow
- Build incident reporting flow

## Admin Web Tasks

- Set up shell layout, routing, and auth
- Build dashboard widgets and live map panel
- Build routes management CRUD
- Build buses management CRUD
- Build drivers management CRUD
- Build students and guardian management CRUD
- Build alerts queue and resolution workflow
- Build reports filters and export

## QA and Safety Tasks

- Add unit tests for attendance transitions
- Add integration tests for trip lifecycle
- Add permission tests by role
- Add stale location and offline recovery tests
- Add audit log verification for high-risk actions
- Add RLS integration tests against staging Supabase branch DB

## Product Decisions To Confirm

- SSE + polling fallback versus WebSocket migration for high-frequency tracking
- QR only vs QR plus manual attendance for MVP
- Single school tenant first or multi-school SaaS from day one
- Whether ETA depends on external maps API in MVP

