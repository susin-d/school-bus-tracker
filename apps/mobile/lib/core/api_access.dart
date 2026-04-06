enum AppApiEndpoint {
  currentTrip,
  parentLiveTrip,
  tripLocation,
  studentAttendanceHistory,
  tripStart,
  tripEnd,
  tripStatusUpdate,
  tripLocationUpdate,
  attendanceBoard,
  attendanceDrop,
  delayAlert,
  leaveRequests,
  alertSos,
  notificationsFeed,
  profile,
}

extension AppApiEndpointLabel on AppApiEndpoint {
  String get label {
    switch (this) {
      case AppApiEndpoint.currentTrip:
        return 'GET /trips/current';
      case AppApiEndpoint.parentLiveTrip:
        return 'GET /parents/students/:studentId/live-trip';
      case AppApiEndpoint.tripLocation:
        return 'GET /trips/:tripId/location';
      case AppApiEndpoint.studentAttendanceHistory:
        return 'GET /students/:studentId/history';
      case AppApiEndpoint.tripStart:
        return 'POST /trips/:tripId/start';
      case AppApiEndpoint.tripEnd:
        return 'POST /trips/:tripId/end';
      case AppApiEndpoint.tripStatusUpdate:
        return 'POST /trips/:tripId/status';
      case AppApiEndpoint.tripLocationUpdate:
        return 'POST /trips/:tripId/location';
      case AppApiEndpoint.attendanceBoard:
        return 'POST /attendance/board';
      case AppApiEndpoint.attendanceDrop:
        return 'POST /attendance/drop';
      case AppApiEndpoint.delayAlert:
        return 'POST /alerts/delay';
      case AppApiEndpoint.leaveRequests:
        return 'POST /leave-requests';
      case AppApiEndpoint.alertSos:
        return 'POST /alerts/sos';
      case AppApiEndpoint.notificationsFeed:
        return 'GET /alerts/feed';
      case AppApiEndpoint.profile:
        return 'GET /auth/me';
    }
  }
}

enum AppRole { parent, driver }

class RoleApiAccess {
  static const Map<AppRole, Set<AppApiEndpoint>> _access = {
    AppRole.parent: {
      AppApiEndpoint.currentTrip,
      AppApiEndpoint.parentLiveTrip,
      AppApiEndpoint.tripLocation,
      AppApiEndpoint.studentAttendanceHistory,
      AppApiEndpoint.leaveRequests,
      AppApiEndpoint.alertSos,
      AppApiEndpoint.notificationsFeed,
      AppApiEndpoint.profile,
    },
    AppRole.driver: {
      AppApiEndpoint.currentTrip,
      AppApiEndpoint.tripLocation,
      AppApiEndpoint.tripStart,
      AppApiEndpoint.tripEnd,
      AppApiEndpoint.tripStatusUpdate,
      AppApiEndpoint.tripLocationUpdate,
      AppApiEndpoint.attendanceBoard,
      AppApiEndpoint.attendanceDrop,
      AppApiEndpoint.delayAlert,
      AppApiEndpoint.profile,
    },
  };

  static bool canAccess(AppRole role, AppApiEndpoint endpoint) {
    return _access[role]?.contains(endpoint) ?? false;
  }

  static List<AppApiEndpoint> allowedEndpoints(AppRole role) {
    return List<AppApiEndpoint>.of(_access[role] ?? const {}).toList();
  }
}
