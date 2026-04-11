# Database Schema (Supabase Postgres)

## Core Domain Tables

### Primary Resources
- `schools` - School organizations with address and map settings
- `users` - Authentication users with roles (parent, driver, admin, super_admin)
- `students` - Student records with transport and location details
- `parents` - Parent/guardian profiles with notification preferences
- `routes` - Transport routes with sequence and direction
- `stops` - Bus stops with addresses and GPS coordinates
- `buses` - Vehicles with capacity, driver, and route assignments
- `drivers` - Driver profiles with license, contact, and employment details

### Transaction & Tracking Tables
- `student_transport_assignments` - Student-to-transport route assignments
- `parent_students` - Parent-to-student relationships (many-to-many)
- `trips` - Daily trip instances with status lifecycle
- `trip_students` - Student manifest for each trip
- `trip_locations` - GPS location history for trips
- `trip_logs` - Boarding/drop-off event log with timestamps
- `student_transport_assignments` - Route assignment tracking
- `attendance_events` - Attendance record audit trail (deprecated, use trip_logs)
- `alerts` - Safety alerts triggered by drivers or system
- `leave_requests` - Parent leave requests for pickup/dropoff exemption

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

- `address_text` (legacy) / `home_address` (new)
- `lat` (legacy) / `latitude` (new)
- `lng` (legacy) / `longitude` (new)
- `geocode_status`
- `place_id`
- `last_geocoded_at`
- `geocode_error`

## Transport Management Schema Enhancements (April 2026)

### Driver Fields Added
- `full_name` - Driver's full name
- `phone_number` - Contact phone
- `email` - Email address
- `date_of_birth` - Personal record
- `gender` - Demographic info
- `license_number` - Driver's license number
- `license_type` - License category (auto enum)
- `license_expiry_date` - License validity
- `police_verification_status` - Verification enum (verified, pending, rejected)
- `employee_id` - Employment reference
- `joining_date` - Employment start date
- `salary` - Compensation
- `status` / `is_active` - Active status (boolean)
- `medical_certificate_expiry` - Health documentation
- `emergency_contact_name` - Next of kin
- `emergency_contact_phone` - Emergency phone
- `assigned_bus_id` - Current bus assignment
- `current_latitude` / `current_longitude` - Last known GPS position
- `is_online` - Active status flag
- `last_active_at` - Last activity timestamp

### Student Fields Added
- `admission_number` - School enrollment ID
- `date_of_birth` - Personal record
- `gender` - Demographic info
- `photo_url` - Student photo
- `class` / `grade` - Academic level
- `section` - Class division
- `roll_number` - Class roll number
- `pickup_stop_id` - Assigned pickup stop
- `drop_stop_id` - Assigned drop-off stop
- `route_id` - Primary transport route
- `assigned_bus_id` - Assigned bus
- `transport_status` - Student enum (active, suspended, etc)
- `home_address` - Full home address
- `latitude` / `longitude` - GPS coordinates
- `rfid_tag` - RFID card identifier
- `qr_code` - QR code for attendance
- `boarding_time` - Expected pickup time
- `drop_time` - Expected drop-off time
- `default_boarding_time` - Standard pickup time
- `default_drop_time` - Standard drop-off time

### Bus Fields Added
- `bus_number` - Display identifier
- `vehicle_number` - Registration/license plate
- `capacity` - Maximum passengers
- `status` - Bus status enum (active, maintenance, retired)
- `driver_id` - Assigned driver
- `route_id` - Primary route
- `gps_device_id` - GPS tracking device
- `is_active` - Operational status

### Route Fields Added
- `route_name` - Route display name
- `route_code` - Route code/number
- `direction` - Route direction (pickup, dropoff, both)
- `description` - Route notes
- `status` - Route status enum (active, archived)

### Stop Fields Added
- `stop_name` - Stop display name
- `address` - Stop address
- `latitude` / `longitude` - Stop GPS location
- `route_id` - Associated route
- `sequence_order` - Order in route
- `is_active` - Operational status

### Parent Fields Added
- Student linkage via `parent_students` junction table
- `notification_preferences` - Notification settings JSON
- Direct `student_id` reference option

### Alert Type Enumerations
- `transport_gender` - Gender enum
- `transport_license_type` - License type enum
- `transport_police_verification_status` - Verification status enum
- `transport_employee_status` - Employment status enum
- `transport_student_status` - Student transport status enum
- `transport_bus_status` - Bus status enum
- `transport_route_status` - Route status enum
- `transport_parent_relation` - Parent/guardian relationship enum
- `transport_trip_log_status` - Trip log status enum
- `transport_alert_type` - Alert type enum

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

### Core Migrations
- `20260404_role_based_access.sql` - Base role model + RLS helpers/policies
- `20260404_map_routing_rls.sql` - Map/routing tables + policies
- `20260404_planner_runs_rls.sql` - Planner run table + policies
- `20260404_operational_observability.sql` - Route engine + planner error audit columns

### Transport Management Upgrade (April 2026)
- `20260411_transport_management_upgrade.sql` - Core transport schema with new fields, enums, and indexes
- `20260411_transport_management_upgrade_followup.sql` - Safety net for partial migrations
- `20260411_transport_management_one_fix.sql` - Idempotent reconciliation for NK/column existence

All migrations are **idempotent** and safe to run multiple times on both fresh and existing databases.

## Fixture/CI Notes

- deterministic RLS fixture seeding script:
  - `apps/api/src/scripts/seed-rls-fixtures.ts`
- CI job applies migrations and executes real RLS integration tests against staging:
  - `.github/workflows/rls-staging.yml`
