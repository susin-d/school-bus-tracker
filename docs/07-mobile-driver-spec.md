# Driver Mobile App Specification

## Driver Home Screen

### Primary Elements

- Current assigned trip card
- Prominent `Start Trip` or `End Trip` action
- Route stop sequence
- Student manifest with attendance status
- Safety reminder banner

## Driver User Flows

### Start Trip

1. Driver signs in with OTP.
2. App loads today's assignment.
3. Driver reviews bus, route, and trip kind.
4. Driver taps `Start Trip`.
5. App requests location permission and begins foreground tracking.

### Boarding

1. Driver selects stop.
2. Driver scans QR or taps student manually.
3. App validates the student assignment.
4. App marks boarded and updates parent notification.

### Drop-Off

1. Driver selects destination stop.
2. Driver marks drop-off by scan or manual tap.
3. App records event and updates parents.

### Delay or Incident Reporting

1. Driver taps incident action only while parked.
2. Driver selects reason category.
3. System notifies admins and, where appropriate, affected parents.

## Driver Safety Rules

- No parent contact details displayed
- GPS cannot be disabled during active trip without ending trip and creating audit log
- Large tap areas and minimal text during active trip
- High-risk actions should be available only when stationary if device telemetry allows

## Offline Strategy

- Buffer attendance actions locally with timestamps
- Retry sync when network returns
- Mark unsynced entries clearly
- Prevent trip end until critical queued events are reconciled or explicitly reviewed

## Driver MVP Screens

- Auth
- Assignment overview
- Active trip console
- Student manifest
- Attendance scan/manual entry
- Incident reporting
- Notifications/instructions
