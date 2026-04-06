# Frontend App Plan

## Primary Frontend Surfaces

### 1. Parent Mobile App
- Platform: Flutter
- Audience: Parents and guardians
- Goal: Track a child trip, receive alerts, view attendance, and submit leave requests

### 2. School Admin Web App
- Platform: React web app
- Audience: School operations staff
- Goal: Manage one school's students, transport resources, alerts, and daily operations

### 3. Super Admin Web App
- Platform: React web app
- Audience: Platform owner or central operations team
- Goal: See all schools, all school admins, and system-wide activity

Note: both web roles run inside the same `apps/admin-web` codebase with route guards and role-based navigation.

## Screen Plan

### Parent Mobile App

#### Auth
- Login
- Phone number / OTP flow
- Session restore

#### Main Screens
- Parent Home
- Live Trip Tracking
- Attendance History
- Leave Request
- Notifications
- Profile and Settings

### School Admin Web App

#### Main Screens
- Dashboard
- Students
- Parents
- Drivers
- Buses
- Routes and Stops
- Assignments
- Alerts Center
- Leave Requests

### Super Admin Web App

#### Main Screens
- Global Dashboard
- Schools
- School Admins
- Users
- Operations Overview
- Platform Settings

## Recommended Folder Structure

### Flutter Parent App

```text
apps/mobile/lib/
  core/
    api_access.dart
    app_scope.dart
    app_state.dart
    theme.dart
  features/
    auth/
      login_screen.dart
      otp_screen.dart
    parent/
      parent_home_screen.dart
      trip_tracking_screen.dart
      attendance_history_screen.dart
      leave_request_screen.dart
      notifications_screen.dart
      profile_screen.dart
    shell/
      app_router.dart
  services/
    auth_service.dart
    trip_service.dart
    attendance_service.dart
    alerts_service.dart
    leave_service.dart
```

### Admin Web

```text
apps/admin-web/src/
  app/
    AdminApp.tsx
  core/
    auth.ts
    api.ts
    roleAccess.ts
  features/
    dashboard/
    schools/
    users/
    students/
    parents/
    drivers/
    buses/
    routes/
    assignments/
    alerts/
    leaveRequests/
  ui/
    layout/
    cards/
    tables/
    filters/
```

## Role Boundaries

### Parent Mobile
- Allowed: current trip, trip location, attendance history, leave requests, parent-safe alerts
- Not allowed: trip status updates, attendance write actions, admin resource management

### School Admin Web
- Allowed: their own school's students, parents, drivers, buses, routes, alerts, leave requests
- Not allowed: other schools, global school creation, super admin management

### Super Admin Web
- Allowed: all schools, all users, global reporting, school admin creation, platform-wide management

## Realtime + Map UX Rules

- Admin web:
  - use SSE map stream with backend-issued `streamToken`
  - reconnect with backoff and `since` cursor resume
  - fallback to polling when stream is unavailable
- Parent app:
  - child-scoped live trip endpoint only
- Driver app:
  - assignment-scoped manifest, stop actions, and heartbeat location updates

## Delivery Order

1. Parent mobile auth and home
2. Parent live trip and attendance history
3. Parent leave request and notifications
4. Admin web shell with school admin dashboard
5. School admin resources: students, buses, routes, alerts, leave requests
6. Super admin global dashboard and schools/users management
7. Realtime updates and production polish
