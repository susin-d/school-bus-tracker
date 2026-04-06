enum AppApiEndpoint {
  currentTrip,
  tripLocation,
  tripManifest,
  tripStart,
  tripEnd,
  tripStatusUpdate,
  tripLocationUpdate,
  tripReoptimize,
  tripMajorDelay,
  tripBreakdown,
  tripStopArrived,
  tripStopBoarded,
  tripStopNoShow,
  attendanceBoard,
  attendanceDrop,
  delayAlert,
  profile,
}

extension AppApiEndpointLabel on AppApiEndpoint {
  String get label {
    switch (this) {
      case AppApiEndpoint.currentTrip:
        return 'GET /trips/current';
      case AppApiEndpoint.tripLocation:
        return 'GET /trips/:tripId/location';
      case AppApiEndpoint.tripManifest:
        return 'GET /trips/:tripId/manifest';
      case AppApiEndpoint.tripStart:
        return 'POST /trips/:tripId/start';
      case AppApiEndpoint.tripEnd:
        return 'POST /trips/:tripId/end';
      case AppApiEndpoint.tripStatusUpdate:
        return 'POST /trips/:tripId/status';
      case AppApiEndpoint.tripLocationUpdate:
        return 'POST /trips/:tripId/location';
      case AppApiEndpoint.tripReoptimize:
        return 'POST /trips/:tripId/reoptimize';
      case AppApiEndpoint.tripMajorDelay:
        return 'POST /trips/:tripId/incidents/major-delay';
      case AppApiEndpoint.tripBreakdown:
        return 'POST /trips/:tripId/incidents/breakdown';
      case AppApiEndpoint.tripStopArrived:
        return 'POST /trips/:tripId/stops/:stopId/arrived';
      case AppApiEndpoint.tripStopBoarded:
        return 'POST /trips/:tripId/stops/:stopId/boarded';
      case AppApiEndpoint.tripStopNoShow:
        return 'POST /trips/:tripId/stops/:stopId/no-show';
      case AppApiEndpoint.attendanceBoard:
        return 'POST /attendance/board';
      case AppApiEndpoint.attendanceDrop:
        return 'POST /attendance/drop';
      case AppApiEndpoint.delayAlert:
        return 'POST /alerts/delay';
      case AppApiEndpoint.profile:
        return 'GET /auth/me';
    }
  }
}

enum AppRole { driver }

class RoleApiAccess {
  static const Set<AppApiEndpoint> _driverAccess = {
    AppApiEndpoint.currentTrip,
    AppApiEndpoint.tripLocation,
    AppApiEndpoint.tripManifest,
    AppApiEndpoint.tripStart,
    AppApiEndpoint.tripEnd,
    AppApiEndpoint.tripStatusUpdate,
    AppApiEndpoint.tripLocationUpdate,
    AppApiEndpoint.tripReoptimize,
    AppApiEndpoint.tripMajorDelay,
    AppApiEndpoint.tripBreakdown,
    AppApiEndpoint.tripStopArrived,
    AppApiEndpoint.tripStopBoarded,
    AppApiEndpoint.tripStopNoShow,
    AppApiEndpoint.attendanceBoard,
    AppApiEndpoint.attendanceDrop,
    AppApiEndpoint.delayAlert,
    AppApiEndpoint.profile,
  };

  static bool canAccess(AppRole role, AppApiEndpoint endpoint) {
    return role == AppRole.driver && _driverAccess.contains(endpoint);
  }

  static List<AppApiEndpoint> allowedEndpoints(AppRole role) {
    if (role != AppRole.driver) {
      return const [];
    }
    return List<AppApiEndpoint>.of(_driverAccess);
  }
}
