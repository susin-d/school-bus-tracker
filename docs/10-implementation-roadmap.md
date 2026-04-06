# Implementation Roadmap

## Milestone 0: Foundation

- Initialize monorepo with pnpm for backend/web and Flutter for mobile
- Configure TypeScript, ESLint, and shared tsconfig for API and admin web
- Create shared package for roles, enums, and API contracts
- Set up CI for lint, typecheck, Flutter analyze, and tests

## Milestone 1: Identity and Core Data

- Implement Supabase-backed OTP and backend email login flows
- Build user profile and role resolution
- Add school, route, bus, driver, parent, and student data models in Supabase Postgres
- Add admin CRUD for base records

## Milestone 2: Trip Lifecycle

- Build trip scheduling and assignment logic
- Implement driver start and end trip flow
- Add location ingestion endpoint and polling + secure SSE realtime delivery
- Build parent live tracking screen in Flutter

## Milestone 3: Attendance and Notifications

- Add boarding and drop-off workflow
- Push parent notifications for attendance and trip status
- Build trip history and attendance views
- Add leave requests and driver visibility

## Milestone 4: Admin Operations

- Dashboard with active trips and alerts
- Reporting endpoints and CSV export
- Incident and delay handling
- Driver-admin instruction workflow

## Milestone 5: Security And Reliability Hardening

- Add stream-token-only SSE auth flow
- Enforce Supabase RLS parity with API role checks
- Add deterministic RLS fixtures and CI enforcement
- Add dependency health checks and structured operational logs

## Milestone 6: Safety Intelligence

- Geofence alerts
- Route deviation detection
- Speed anomaly detection
- SOS escalation workflow

## Milestone 7: Premium Features

- Face recognition attendance research spike
- Bus capacity monitoring
- Multi-language support
