# Parent Mobile App Specification

## Parent Home Screen

### Primary Elements

- Full-screen map centered on assigned bus during active trip
- Status card showing:
  - child name
  - bus number
  - route name
  - current trip status
  - last updated time
- Alert banner for delay, incident, or stale tracking

### Actions

- View child's trip history
- Mark planned absence
- Open support/help flow
- View notifications inbox

## Parent User Flows

### Live Tracking Flow

1. Parent signs in with OTP.
2. App resolves linked student assignments.
3. If a trip is active, show bus on map and current ETA.
4. If no trip is active, show next scheduled pickup or drop-off.

### Leave Request Flow

1. Parent selects child and date.
2. Parent chooses pickup or drop-off or both.
3. Parent provides optional reason.
4. System confirms request and updates driver/admin visibility.

### Attendance History Flow

1. Parent opens child history.
2. App shows recent trips with boarded and dropped times.
3. Parent can filter by date range.

## Edge Cases

- GPS stale for more than threshold: show "Location updating" state
- Child has no active assignment: show support instruction instead of map
- Parent has multiple children: switcher at top of screen
- Notification delivery fails: in-app inbox still reflects server state

## Parent MVP Screens

- Splash and auth
- Child selection if needed
- Home live map
- Notifications
- Leave request form
- Trip history
- Profile and support
