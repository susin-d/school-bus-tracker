# Driver Mobile App Specification (Updated April 2026)

## Implementation Status

✅ **Complete & Production Ready**
- ✅ Authentication (OTP-based)
- ✅ Trip management lifecycle
- ✅ Location tracking (GPS polling)
- ✅ Student attendance recording
- ✅ Incident/delay reporting
- ✅ Offline support with sync queue
- ⏳ Enhanced offline-first capabilities (planned)

## Driver Home Screen

### Primary Elements

- Current assigned trip card with route and student count
- Prominent `Start Trip` / `End Trip` action buttons
- Route stop sequence with ETA display
- Student manifest with attendance status indicators
- Safety reminder banner (compliance/vehicle checks)
- Network status indicator

## Driver User Flows

### Authentication Flow

1. Driver opens app
2. Driver enters phone number and receives OTP
3. Driver enters OTP code
4. System validates and creates JWT session
5. App stores token in secure storage
6. App loads driver profile and today's assignments

### Start Trip Workflow

1. Driver signs in with OTP
2. App loads today's assigned trip(s)
3. Driver reviews bus number, route name, and student list
4. Driver taps `Start Trip` button
5. App requests location permission for foreground service
6. App begins GPS tracking (10-second intervals recommended)
7. Trip status updates to "active"
8. Parent notifications sent (optional)

### Boarding Workflow

1. Driver arrives at pickup stop
2. System marks stop as "arrived"
3. Driver selects student from list
4. Driver can:
   - **Scan QR/RFID** - Auto-validates student
   - **Manual Tap** - Confirms student name match visually
5. App records boarding timestamp
6. Student appearance updates (✓ boarded)
7. Parent notification sent (optional)

### Drop-Off Workflow

1. Driver arrives at student's drop-off location
2. System marks stop as "arrived"
3. Driver selects student from passenger list
4. Driver taps "Drop-off" action
5. App records drop-off timestamp and location
6. Student removed from active list
7. Parent notification sent

### Incident Reporting Workflow

1. Driver identifies issue (major delay, vehicle breakdown, etc.)
2. Driver taps incident button
3. **App requires: vehicle stationary** (GPS speed < 5 km/h)
4. Driver selects incident type:
   - Major Delay (mechanical issue, traffic, etc.)
   - Vehicle Breakdown (requires roadside assistance)
   - Safety Concern (SOS escalation)
5. Driver provides optional message/notes
6. System creates alert (visible to admins immediately)
7. Admins notified via dashboard and email
8. Affected parents notified if trip impacted

## Driver Safety Rules

### Data Privacy
- No parent contact details displayed in app
- No student home address display (only stop addresses)
- No passenger manifests shared externally

### Operational Safety
- GPS cannot be disabled during active trip without:
  - Ending trip first, OR
  - Creating explicit audit log entry
- Large tap areas (minimum 48x48dp) for safety
- High-contrast text for readability
- Minimal required reading during active trip

### Location Tracking
- Continuous GPS polling while trip is active
- Location data cached locally for offline sync
- Location shared via secure SSE with admins
- Automatic retry on network reconnection

### Incident Isolation
- Incident actions only available when stationary
- Driver cannot mark boarded/drop without valid student
- System validates student against assigned list

## Offline Strategy

### Local Buffering
- Queue attendance actions (boarding/drop) locally with timestamps
- Cache trip manifest and student list
- Persist GPS locations with timestamp
- Store incident reports with full context

### Sync on Reconnection
- Automatically sync queued actions when network returns
- Show unsynced items clearly (grayed out until confirmed)
- Allow batch confirmation of synced actions
- Prevent trip end until critical queued events synced/reviewed

### Fallback Display
- Show cached trip data if API unavailable
- Indicate all screens are "offline mode"
- Disable real-time ETA updates
- Disable admin notifications (queued for sync)

## Driver MVP Screens

| Screen | Status | Purpose |
|--------|--------|---------|
| Auth / Login | ✅ Complete | OTP entry and verification |
| Assignment Overview | ✅ Complete | Today's trip(s) and route(s) |
| Active Trip Console | ✅ Complete | Current trip details, start/end, location |
| Student Manifest | ✅ Complete | Passenger list with boarding status |
| Attendance Scan/Manual | ✅ Complete | QR/RFID scan or tap-to-board |
| Incident Reporting | ✅ Complete | Delay/breakdown/safety alerts |
| Notifications/Instructions | ✅ Complete | Admin messages and alerts |
| Profile / Settings | ✅ Complete | Driver info, logout |

## API Endpoint Mapping

**Authentication**
- `POST /auth/otp/send` - Request OTP to phone
- `POST /auth/otp/verify` - Verify OTP and get session token
- `GET /auth/me` - Get driver profile

**Trips**
- `GET /trips/current` - Get assigned trip
- `GET /trips/:tripId/manifest` - Get student manifest
- `POST /trips/:tripId/start` - Begin trip
- `POST /trips/:tripId/end` - Complete trip
- `POST /trips/:tripId/status` - Update trip status

**Location**
- `POST /trips/:tripId/location` - Report GPS location

**Stops**
- `POST /trips/:tripId/stops/:stopId/arrived` - Mark stop arrival
- `POST /trips/:tripId/stops/:stopId/boarded` - Mark student boarded
- `POST /trips/:tripId/stops/:stopId/no-show` - Mark no-show

**Attendance**
- `POST /attendance/board` - Record boarding event
- `POST /attendance/drop` - Record drop-off event

**Incidents**
- `POST /trips/:tripId/incidents/major-delay` - Report delay
- `POST /trips/:tripId/incidents/breakdown` - Report breakdown
- `POST /alerts/delay` - Create delay alert
- `POST /trips/:tripId/reoptimize` - Request route reoptimization

## Configuration

### Environment Variables (.env)
```
API_BASE_URL=https://api.yourschool.com
AUTH_REDIRECT_URL=https://app.yourschool.com/auth/callback
```

### Permissions Required (Android/iOS)
- **Location (Always)** - Continuous GPS during trips
- **Camera** - QR code scanning for attendance
- **Background Execution** - Location tracking while app backgrounded
- **Notifications** - Admin alerts and messages

## Performance & Reliability

### Location Updates
- Recommended: Every 10 seconds during active trip
- Buffer size: Up to 100 locations if offline
- Batch send: 5-10 locations per API call to reduce bandwidth

### Network Handling
- Automatic retry with exponential backoff
- Polling fallback if SSE unavailable
- Offline-first architecture preserves data
- Clear indication of sync status to driver

### Battery & Data
- Foreground service for location tracking (prevents OS kill)
- Adaptive GPS polling (increase interval in low-motion scenarios)
- Data saver mode available (reduce polling frequency)

## Testing Checklist

- [ ] OTP flow with valid/invalid codes
- [ ] Start trip while offline
- [ ] Record attendance offline (verify sync after reconnect)
- [ ] Report incident with photo/notes
- [ ] GPS location updates every 10 seconds
- [ ] Battery drain over 8-hour trip
- [ ] Network switch (WiFi to cellular)
- [ ] App backgrounding/foregrounding
- [ ] Permission denial handling
