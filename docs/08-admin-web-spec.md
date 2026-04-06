# Admin Web Specification

The admin web is one frontend with two role modes:

- school admin (`admin`) scoped to one school
- super admin (`super_admin`) scoped across schools

## Dashboard

### Widgets

- Active trips
- Delayed trips
- Unresolved alerts
- Students currently onboard
- Planner run status and failures
- Dependency health summary (Supabase/Google/Brevo)

### Main Panels

- Live map overview (Google Maps SDK)
- Alerts queue
- Recent attendance anomalies
- Route health and incident drill-down

## Admin Modules

### Routes and Stops

- Create routes
- Order stops
- Set geofence radius
- Assign planned times

### Buses

- Manage bus records
- Track capacity and operational status

### Drivers

- Manage driver records
- Verify credentials
- Assign buses and routes

### Students

- Manage student profiles
- Link parents/guardians
- Assign transport route and stops

### Trips

- View current and historical trips
- Force-close only with reason logging
- Review route deviation history

### Alerts

- Triage by severity
- Acknowledge and resolve with notes
- Escalate unresolved SOS events

### Live Maps

- School admin:
  - all active drivers for own school
  - delayed marker state
  - trip drilldown and ETA panel
- Super admin:
  - cross-school markers
  - school-level clustering
  - incident context by school

### Reports

- Daily attendance
- Trip completion
- Delay frequency
- Bus utilization

## Auth + Session

- Login (backend email login endpoint)
- Preview mode (local role simulation)
- Session mode (backend-mediated auth token)

## Admin Pages

- Dashboard
- Routes
- Buses
- Drivers
- Students
- Assignments
- Alerts
- Leave Requests
- Schools (super admin)
- Users (admin + super admin views)
