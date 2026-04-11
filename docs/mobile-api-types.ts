// Generated response type mappings for mobile API endpoints
// These types help ensure proper parsing of API responses

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    role: 'driver' | 'parent' | 'admin' | 'super_admin';
    fullName?: string;
    full_name?: string; // Fallback for old schema
    email?: string;
    schoolId?: string;
    school_id?: string;
  };
}

export interface TripResponse {
  trip?: {
    id: string;
    status: 'ready' | 'active' | 'paused' | 'completed' | 'cancelled';
    routeName?: string;
    route_name?: string;
    busLabel?: string;
    bus_number?: string;
    busNumber?: string;
    driverName?: string;
    driver_name?: string;
    estimatedDistance?: number;
    plannedDuration?: number;
    createdAt: string;
  };
  students?: Array<{
    id: string;
    fullName?: string;
    full_name?: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    homeAddress?: string;
    home_address?: string;
    status: string;
  }>;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speedKph?: number;
  };
}

export interface TripManifestResponse {
  tripId: string;
  driverName: string;
  driver_name?: string;
  routeName: string;
  route_name?: string;
  busLabel: string;
  bus_number?: string;
  students: Array<{
    id: string;
    fullName: string;
    full_name?: string;
    pickupTime?: string;
    dropTime?: string;
    status?: string;
  }>;
  estimatedDistance: number;
  estimatedDurationMinutes: number;
}

export interface LocationUpdateResponse {
  ok: boolean;
  recordedAt: string;
  tripId?: string;
  latitude?: number;
  longitude?: number;
}

export interface TripActionResponse {
  ok: boolean;
  tripId: string;
  status?: string;
}

export interface StopActionResponse {
  ok: boolean;
  tripId: string;
  stopId: string;
  status?: string;
  attendanceRecord?: {
    id: string;
    studentId: string;
    eventType: 'boarded' | 'dropped' | 'absent' | 'manual_override';
    recordedAt: string;
  };
}

export interface AttendanceResponse {
  attendanceId: string;
  tripId: string;
  studentId: string;
  eventType: 'boarded' | 'dropped' | 'absent' | 'manual_override';
  recordedAt: string;
  notes?: string;
}

export interface AlertResponse {
  id: string;
  tripId?: string;
  type: 'sos' | 'delay' | 'geofence' | 'route_deviation' | 'speed_anomaly' | 'attendance_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status?: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
  triggeredBy?: string;
}

export interface LiveTripResponse {
  liveTrip: {
    tripId: string;
    driverName?: string;
    driver_name?: string;
    busLocation?: {
      latitude: number;
      longitude: number;
      timestamp: string;
      speedKph?: number;
    };
    nextStop?: {
      id: string;
      stopName?: string;
      stop_name?: string;
      addressText?: string;
      address?: string;
      latitude: number;
      longitude: number;
      plannedEta?: string;
      currentEta?: string;
      studentName?: string;
    };
    studentStop?: {
      id: string;
      stopName?: string;
      stop_name?: string;
      latitude: number;
      longitude: number;
      stopStatus?: 'scheduled' | 'arrived' | 'boarded' | 'dropped' | 'no_show';
    };
    estimatedDropoffAt?: string;
    routeName?: string;
    route_name?: string;
  };
}

export interface StudentHistoryResponse {
  history?: Array<{
    id: string;
    tripId: string;
    date: string;
    status: 'boarded' | 'dropped' | 'absent' | 'no_show';
    boardedAt?: string;
    droppedAt?: string;
    routeName?: string;
    route_name?: string;
  }>;
}

export interface LeaveRequestResponse {
  id: string;
  studentId: string;
  student_id?: string;
  leaveDate: string;
  leave_date?: string;
  tripKind: 'pickup' | 'dropoff' | 'both';
  trip_kind?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
  created_at?: string;
}

export interface NotificationFeedResponse {
  alerts?: Array<AlertResponse>;
}
