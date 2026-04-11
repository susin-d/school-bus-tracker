import '../../core/api_client.dart';

class DriverApi {
  DriverApi(this._client);

  final ApiClient _client;

  Future<Map<String, dynamic>> getCurrentTrip() async {
    final payload = await _client.get('/trips/current') as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> getTripManifest(String tripId) async {
    final payload = await _client.get('/trips/$tripId/manifest') as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> startTrip(String tripId) async {
    final payload = await _client.post('/trips/$tripId/start', const <String, dynamic>{}) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> endTrip(String tripId) async {
    final payload = await _client.post('/trips/$tripId/end', const <String, dynamic>{}) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> updateTripStatus({
    required String tripId,
    required String status,
  }) async {
    final payload = await _client.post('/trips/$tripId/status', {
      'status': status
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> updateTripLocation({
    required String tripId,
    required double latitude,
    required double longitude,
    double? speedKph,
  }) async {
    final payload = await _client.post('/trips/$tripId/location', {
      'latitude': latitude,
      'longitude': longitude,
      'speedKph': speedKph
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> reoptimizeTrip({
    required String tripId,
    String? reason,
  }) async {
    final payload = await _client.post('/trips/$tripId/reoptimize', {
      if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> reportMajorDelay({
    required String tripId,
    String? message,
  }) async {
    final payload = await _client.post('/trips/$tripId/incidents/major-delay', {
      if (message != null && message.trim().isNotEmpty) 'message': message.trim(),
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> reportBreakdown({
    required String tripId,
    String? message,
  }) async {
    final payload = await _client.post('/trips/$tripId/incidents/breakdown', {
      if (message != null && message.trim().isNotEmpty) 'message': message.trim(),
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> markStopArrived({
    required String tripId,
    required String stopId,
  }) async {
    final payload = await _client.post('/trips/$tripId/stops/$stopId/arrived', const <String, dynamic>{}) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> markStopBoarded({
    required String tripId,
    required String stopId,
    String? notes,
  }) async {
    final payload = await _client.post('/trips/$tripId/stops/$stopId/boarded', {
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> markStopNoShow({
    required String tripId,
    required String stopId,
    String? notes,
  }) async {
    final payload = await _client.post('/trips/$tripId/stops/$stopId/no-show', {
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> boardStudent({
    required String tripId,
    required String studentId,
  }) async {
    final payload = await _client.post('/attendance/board', {
      'tripId': tripId,
      'studentId': studentId
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> dropStudent({
    required String tripId,
    required String studentId,
  }) async {
    final payload = await _client.post('/attendance/drop', {
      'tripId': tripId,
      'studentId': studentId
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> reportDelay({
    required String tripId,
    required String message,
    String severity = 'medium',
  }) async {
    final payload = await _client.post('/alerts/delay', {
      'tripId': tripId,
      'message': message,
      'severity': severity
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> updateStopStatus({
    required String tripId,
    required String stopId,
    required String status,
  }) async {
    final payload = await _client.post('/trips/$tripId/stops/$stopId/status', {
      'status': status
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> getProfile() async {
    final payload = await _client.get('/auth/me') as Map<String, dynamic>;
    return (payload['user'] as Map<String, dynamic>? ?? const <String, dynamic>{});
  }
}
