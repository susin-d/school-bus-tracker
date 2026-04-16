import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

enum TrafficLevel { low, medium, high, unknown }

class TrafficEstimate {
  const TrafficEstimate({
    required this.distanceMeters,
    required this.durationSeconds,
    this.durationInTrafficSeconds,
  });

  final int distanceMeters;
  final int durationSeconds;
  final int? durationInTrafficSeconds;

  int get effectiveDurationSeconds => durationInTrafficSeconds ?? durationSeconds;

  TrafficLevel get trafficLevel {
    final traffic = durationInTrafficSeconds;
    if (traffic == null || durationSeconds <= 0) {
      return TrafficLevel.unknown;
    }

    final ratio = traffic / durationSeconds;
    if (ratio >= 1.45) return TrafficLevel.high;
    if (ratio >= 1.2) return TrafficLevel.medium;
    return TrafficLevel.low;
  }
}

class TrafficService {
  static String _readMapsKey() {
    return (dotenv.env['GOOGLE_MAPS_API_KEY'] ??
            dotenv.env['VITE_GOOGLE_MAPS_API_KEY'] ??
            '')
        .trim();
  }

  Future<TrafficEstimate> estimateTravel({
    required LatLng origin,
    required LatLng destination,
  }) async {
    final mapsKey = _readMapsKey();
    if (mapsKey.isEmpty) {
      return _fallbackEstimate(origin, destination);
    }

    try {
      final uri = Uri.https('maps.googleapis.com', '/maps/api/distancematrix/json', {
        'origins': '${origin.latitude},${origin.longitude}',
        'destinations': '${destination.latitude},${destination.longitude}',
        'mode': 'driving',
        'departure_time': 'now',
        'traffic_model': 'best_guess',
        'key': mapsKey,
      });

      final request = await HttpClient().getUrl(uri);
      final response = await request.close();
      final raw = await utf8.decodeStream(response);
      final payload = jsonDecode(raw) as Map<String, dynamic>;

      final rows = payload['rows'] as List<dynamic>?;
      if (rows == null || rows.isEmpty) {
        return _fallbackEstimate(origin, destination);
      }

      final row = rows.first as Map<String, dynamic>?;
      final elements = row?['elements'] as List<dynamic>?;
      if (elements == null || elements.isEmpty) {
        return _fallbackEstimate(origin, destination);
      }

      final element = elements.first as Map<String, dynamic>;
      if ((element['status'] ?? '').toString() != 'OK') {
        return _fallbackEstimate(origin, destination);
      }

      final distanceMeters = ((element['distance'] as Map<String, dynamic>?)?['value'] as num?)?.toInt();
      final durationSeconds = ((element['duration'] as Map<String, dynamic>?)?['value'] as num?)?.toInt();
      final durationTrafficSeconds = ((element['duration_in_traffic'] as Map<String, dynamic>?)?['value'] as num?)?.toInt();

      if (distanceMeters == null || durationSeconds == null || durationSeconds <= 0) {
        return _fallbackEstimate(origin, destination);
      }

      return TrafficEstimate(
        distanceMeters: distanceMeters,
        durationSeconds: durationSeconds,
        durationInTrafficSeconds: durationTrafficSeconds,
      );
    } catch (_) {
      return _fallbackEstimate(origin, destination);
    }
  }

  TrafficEstimate _fallbackEstimate(LatLng origin, LatLng destination) {
    final distance = _haversineDistanceMeters(origin, destination);
    const averageSpeedKph = 25.0;
    final durationHours = distance / 1000 / averageSpeedKph;
    final seconds = math.max(60, (durationHours * 3600).round());

    return TrafficEstimate(
      distanceMeters: distance.round(),
      durationSeconds: seconds,
      durationInTrafficSeconds: null,
    );
  }

  double _haversineDistanceMeters(LatLng a, LatLng b) {
    const earthRadiusMeters = 6371000.0;
    final dLat = _toRadians(b.latitude - a.latitude);
    final dLng = _toRadians(b.longitude - a.longitude);
    final lat1 = _toRadians(a.latitude);
    final lat2 = _toRadians(b.latitude);

    final h = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1) * math.cos(lat2) * math.sin(dLng / 2) * math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h));
    return earthRadiusMeters * c;
  }

  double _toRadians(double degree) => degree * (math.pi / 180.0);
}
