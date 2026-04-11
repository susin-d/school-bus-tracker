import 'dart:async';

import 'package:geolocator/geolocator.dart';

class LocationService {
  Timer? _timer;
  bool _running = false;

  bool get isTracking => _running;

  /// Request location permissions. Returns true if granted.
  Future<bool> requestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Get current GPS position.
  Future<Position?> getCurrentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  /// Start periodic location tracking.
  /// [onLocation] is called every [intervalSeconds] with lat/lng.
  void startTracking({
    required Future<void> Function(double latitude, double longitude) onLocation,
    int intervalSeconds = 10,
    void Function(String error)? onError,
  }) {
    stopTracking();
    _running = true;

    _timer = Timer.periodic(Duration(seconds: intervalSeconds), (_) async {
      if (!_running) return;

      try {
        final position = await getCurrentPosition();
        if (position != null && _running) {
          await onLocation(position.latitude, position.longitude);
        }
      } catch (e) {
        onError?.call(e.toString());
      }
    });
  }

  void stopTracking() {
    _running = false;
    _timer?.cancel();
    _timer = null;
  }

  void dispose() {
    stopTracking();
  }
}
