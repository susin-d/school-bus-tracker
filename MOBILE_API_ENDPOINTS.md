# Mobile Apps - API Endpoints Reference

**Last Updated**: April 11, 2026  
**Base URL**: http://localhost:4000 (development) | Production URL (production)

---

## Driver Mobile App Endpoints

### Authentication
- **POST** `/auth/otp/send` - Send OTP to phone number
  - Request: `{ phone: string }`
  - Response: `{ success: boolean }`

- **POST** `/auth/otp/verify` - Verify OTP and get session token
  - Request: `{ phone: string, otp: string }`
  - Response: `{ token: string, user: { id, role, fullName } }`

- **POST** `/auth/forgot-password` - Send password reset email
  - Request: `{ email: string, redirectTo?: string }`
  - Response: `{ success: boolean }`

- **POST** `/auth/email/send-verification` - Send verification email
  - Request: `{ email: string, fullName: string, redirectTo?: string }`
  - Response: `{ success: boolean }`

- **GET** `/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ user: { id, fullName, role, school_id } }`

### Trips (Driver)
- **GET** `/trips/current` - Get current assigned trip
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ trip: {...}, students: [...], lastLocation: {...} }`

- **GET** `/trips/:tripId/manifest` - Get trip manifest with student list
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ tripId, driverName, routeName, students: [...], estimatedDistance, ... }`

- **GET** `/trips/:tripId/location` - Get current trip location
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ tripId, status, location: { latitude, longitude, timestamp } }`

- **POST** `/trips/:tripId/start` - Start a trip
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ ok: true, tripId, status: "active" }`

- **POST** `/trips/:tripId/end` - End/complete a trip
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ ok: true, tripId, status: "completed" }`

- **POST** `/trips/:tripId/status` - Update trip status
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ status: "ready" | "active" | "paused" | "completed" | "cancelled" }`
  - Response: `{ ok: true, tripId, status }`

- **POST** `/trips/:tripId/location` - Update driver location (GPS tracking)
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ latitude: number, longitude: number, speedKph?: number, heading?: number, recordedAt?: ISO8601 }`
  - Response: `{ ok: true, recordedAt }`

- **POST** `/trips/:tripId/reoptimize` - Reoptimize trip route
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ reason?: string }`
  - Response: `{ ok: true, tripId, optimizationResult: {...} }`

### Trip Incidents
- **POST** `/trips/:tripId/incidents/major-delay` - Report major delay
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ message?: string }`
  - Response: `{ alertId, tripId, severity: "high", type: "delay" }`

- **POST** `/trips/:tripId/incidents/breakdown` - Report vehicle breakdown
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ message?: string }`
  - Response: `{ alertId, tripId, severity: "critical", type: "breakdown" }`

### Trip Stops
- **POST** `/trips/:tripId/stops/:stopId/arrived` - Mark stop as arrived
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ ok: true, tripId, stopId, status: "arrived" }`

- **POST** `/trips/:tripId/stops/:stopId/boarded` - Mark student as boarded
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ notes?: string }`
  - Response: `{ ok: true, tripId, stopId, attendanceRecord: {...} }`

- **POST** `/trips/:tripId/stops/:stopId/no-show` - Mark student as no-show
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ notes?: string }`
  - Response: `{ ok: true, tripId, stopId, attendanceRecord: {...} }`

### Attendance
- **POST** `/attendance/board` - Mark student as boarded (alternative)
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ tripId: string, studentId: string }`
  - Response: `{ attendanceId, tripId, studentId, eventType: "boarded" }`

- **POST** `/attendance/drop` - Mark student as dropped off
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ tripId: string, studentId: string }`
  - Response: `{ attendanceId, tripId, studentId, eventType: "dropped" }`

### Alerts
- **POST** `/alerts/delay` - Report trip delay
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ tripId: string, message: string, severity?: "low" | "medium" | "high" | "critical" }`
  - Response: `{ alertId, tripId, type: "delay", severity, message }`

---

## Parent Mobile App Endpoints

### Authentication
- **POST** `/auth/otp/send` - Send OTP to phone
  - Request: `{ phone: string }`
  - Response: `{ success: boolean }`

- **POST** `/auth/otp/verify` - Verify OTP and get session
  - Request: `{ phone: string, otp: string }`
  - Response: `{ token: string, user: { id, role, fullName } }`

- **POST** `/auth/email-login` - Email/password login
  - Request: `{ email: string, password: string }`
  - Response: `{ token: string, user: { id, role, fullName } }`

- **POST** `/auth/forgot-password` - Send password reset
  - Request: `{ email: string, redirectTo?: string }`
  - Response: `{ success: boolean }`

- **GET** `/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ user: { id, fullName, role, school_id } }`

### Trips (Parent)
- **GET** `/trips/current` - Get child's current trip
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ trip: {...}, students: [...], lastLocation: {...} }`

### Live Trip Tracking
- **GET** `/parents/students/:studentId/live-trip` - Get live trip tracking for a student
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ liveTrip: { busLocation: {...}, driverName, nextStop: {...}, studentStop: {...}, estimatedDropoffAt, ... } }`

### Student Records
- **GET** `/students/:studentId/history` - Get student attendance/trip history
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ history: [{ date, tripId, status, boardedAt, droppedAt, ... }] }`

### Leave Requests
- **GET** `/leave-requests` - Get all leave requests for parent's children
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ requests: [{ id, studentId, leaveDate, tripKind, status, ... }] }`

- **POST** `/leave-requests` - Create new leave request
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ studentId: string, leaveDate: ISO8601, tripKind: "pickup" | "dropoff" | "both", reason?: string }`
  - Response: `{ id, studentId, leaveDate, tripKind, status: "pending", ... }`

### Alerts & Notifications
- **GET** `/alerts/feed` - Get notification feed and alerts
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ alerts: [{ id, type, severity, message, createdAt, ... }] }`

- **POST** `/alerts/sos` - Send SOS alert
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ message: string, severity?: "critical" }`
  - Response: `{ alertId, type: "sos", severity: "critical", message, createdAt }`

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- **200** - Success (GET, POST with response)
- **201** - Created (POST creating new resource)
- **204** - No Content (successful DELETE/POST without response)
- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **500** - Server Error

Error Response Format:
```json
{
  "error": "Error message",
  "code": "error_code"
}
```

---

## Authentication

### Bearer Token
Include in Authorization header:
```
Authorization: Bearer {accessToken}
```

### User ID Header (Dev only)
```
x-user-id: {userId}
```

---

## Environment Configuration

Driver Mobile (`apps/driver-mobile/.env`):
```
API_BASE_URL=http://localhost:4000
AUTH_REDIRECT_URL=https://yourapp.com/auth/callback
```

Parent Mobile (`apps/parents-app/.env`):
```
API_BASE_URL=http://localhost:4000
AUTH_REDIRECT_URL=https://yourapp.com/auth/callback
```

---

## Implementation Status

### ✅ Fully Implemented
- All authentication endpoints
- All trip management endpoints
- All attendance tracking endpoints
- All alert/incident reporting endpoints
- Real-time location tracking
- Leave request management
- Live trip tracking for parents
- Student history and attendance records

### Testing
Run backend API tests:
```bash
npm run -w @school-bus/api test
```

### Schema Alignment
All endpoints respect the new database schema:
- Driver fields: `full_name`, `phone_number`, `license_number`, `assigned_bus_id`
- Student fields: `first_name`, `last_name`, `home_address`, `latitude`, `longitude`
- Route fields: `route_name`, `route_code`, `direction`, `description`
- Bus fields: `bus_number`, `vehicle_number`, `driver_id`, `route_id`
