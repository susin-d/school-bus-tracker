import 'package:flutter/foundation.dart';
import 'session_manager.dart';

enum AppRole { driver }

class LoggedInUser {
  const LoggedInUser({
    required this.id,
    required this.fullName,
    required this.role,
    this.accessToken,
    this.gender,
    this.dateOfBirth,
    this.assignedBusId,
    this.busLabel,
    this.busPlate,
  });

  final String id;
  final String fullName;
  final AppRole role;
  final String? accessToken;
  final String? gender;
  final String? dateOfBirth;
  final String? assignedBusId;
  final String? busLabel;
  final String? busPlate;

  int? get age {
    if (dateOfBirth == null) return null;
    try {
      final dob = DateTime.parse(dateOfBirth!);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return age;
    } catch (_) {
      return null;
    }
  }
}


class TripData {
  const TripData({
    required this.id,
    required this.status,
    this.routeName,
    this.driverName,
    this.studentCount = 0,
    this.busNo,
    this.plateNumber,
    this.driverPhone,
    this.raw = const <String, dynamic>{},
  });

  final String id;
  final String status;
  final String? routeName;
  final String? driverName;
  final int studentCount;
  final String? busNo;
  final String? plateNumber;
  final String? driverPhone;
  final Map<String, dynamic> raw;

  TripData copyWith({
    String? status,
    Map<String, dynamic>? raw,
    String? busNo,
    String? plateNumber,
    String? driverPhone,
  }) {
    return TripData(
      id: id,
      status: status ?? this.status,
      routeName: routeName,
      driverName: driverName,
      studentCount: studentCount,
      busNo: busNo ?? this.busNo,
      plateNumber: plateNumber ?? this.plateNumber,
      driverPhone: driverPhone ?? this.driverPhone,
      raw: raw ?? this.raw,
    );
  }
}


class AppState extends ChangeNotifier {
  final _sessionManager = SessionManager();
  LoggedInUser? _currentUser;
  TripData? _currentTrip;
  List<Map<String, dynamic>> _manifestStops = const [];
  bool _loading = false;
  String? _error;
  bool _isInit = false;

  bool get isInit => _isInit;

  LoggedInUser? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  Future<void> loadSession() async {
    _currentUser = await _sessionManager.loadSession();
    _isInit = true;
    notifyListeners();
  }

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
    String? gender,
    String? dateOfBirth,
    String? assignedBusId,
    String? busLabel,
    String? busPlate,
  }) {
    _currentUser = LoggedInUser(
      id: userId,
      fullName: fullName,
      role: role,
      accessToken: accessToken,
      gender: gender,
      dateOfBirth: dateOfBirth,
      assignedBusId: assignedBusId,
      busLabel: busLabel,
      busPlate: busPlate,
    );
    _sessionManager.saveSession(_currentUser!);
    notifyListeners();
  }


  void signOut() {
    _currentUser = null;
    _currentTrip = null;
    _manifestStops = const [];
    _loading = false;
    _error = null;
    _sessionManager.clearSession();
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
