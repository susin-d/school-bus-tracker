import 'package:flutter/foundation.dart';

enum AppRole { driver }

class LoggedInUser {
  const LoggedInUser({
    required this.id,
    required this.fullName,
    required this.role,
    this.accessToken,
  });

  final String id;
  final String fullName;
  final AppRole role;
  final String? accessToken;
}

class TripData {
  const TripData({
    required this.id,
    required this.status,
    this.routeName,
    this.driverName,
    this.studentCount = 0,
    this.raw = const <String, dynamic>{},
  });

  final String id;
  final String status;
  final String? routeName;
  final String? driverName;
  final int studentCount;
  final Map<String, dynamic> raw;

  TripData copyWith({String? status, Map<String, dynamic>? raw}) {
    return TripData(
      id: id,
      status: status ?? this.status,
      routeName: routeName,
      driverName: driverName,
      studentCount: studentCount,
      raw: raw ?? this.raw,
    );
  }
}

class AppState extends ChangeNotifier {
  LoggedInUser? _currentUser;
  TripData? _currentTrip;
  List<Map<String, dynamic>> _manifestStops = const [];
  bool _loading = false;
  String? _error;

  LoggedInUser? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  TripData? get currentTrip => _currentTrip;
  bool get hasActiveTrip => _currentTrip != null;
  List<Map<String, dynamic>> get manifestStops => _manifestStops;

  bool get loading => _loading;
  String? get error => _error;

  void signIn({
    required String userId,
    required String fullName,
    required AppRole role,
    String? accessToken,
  }) {
    _currentUser = LoggedInUser(
      id: userId,
      fullName: fullName,
      role: role,
      accessToken: accessToken,
    );
    notifyListeners();
  }

  void signOut() {
    _currentUser = null;
    _currentTrip = null;
    _manifestStops = const [];
    _loading = false;
    _error = null;
    notifyListeners();
  }

  void setTrip(TripData? trip) {
    _currentTrip = trip;
    if (trip == null) {
      _manifestStops = const [];
    }
    notifyListeners();
  }

  void updateTripStatus(String status) {
    if (_currentTrip != null) {
      _currentTrip = _currentTrip!.copyWith(status: status);
      notifyListeners();
    }
  }

  void setManifestStops(List<Map<String, dynamic>> stops) {
    _manifestStops = stops;
    notifyListeners();
  }

  void updateStopStatus(String stopId, String newStatus) {
    final index = _manifestStops.indexWhere((s) => s['id']?.toString() == stopId);
    if (index >= 0) {
      _manifestStops = List<Map<String, dynamic>>.of(_manifestStops);
      _manifestStops[index] = Map<String, dynamic>.of(_manifestStops[index])
        ..['stopStatus'] = newStatus;
      notifyListeners();
    }
  }

  void setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  void setError(String? message) {
    _error = message;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
