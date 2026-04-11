import '../../core/api_client.dart';

class ParentApi {
  ParentApi(this._client);

  final ApiClient _client;

  Future<Map<String, dynamic>> getCurrentTrip() async {
    final payload = await _client.get('/trips/current') as Map<String, dynamic>;
    return payload;
  }

  Future<Map<String, dynamic>> getStudentLiveTrip(String studentId) async {
    final payload = await _client.get('/parents/students/$studentId/live-trip') as Map<String, dynamic>;
    return (payload['liveTrip'] as Map<String, dynamic>? ?? const <String, dynamic>{});
  }

  Future<List<dynamic>> getAttendanceHistory(String studentId) async {
    final payload = await _client.get('/students/$studentId/history') as Map<String, dynamic>;
    return (payload['history'] as List<dynamic>? ?? const []);
  }

  Future<List<dynamic>> getLeaveRequests() async {
    final payload = await _client.get('/leave-requests') as Map<String, dynamic>;
    return (payload['requests'] as List<dynamic>? ?? const []);
  }

  Future<Map<String, dynamic>> submitLeaveRequest({
    required String studentId,
    required String leaveDateIso,
    required String tripKind,
    String? reason,
  }) async {
    final payload = await _client.post('/leave-requests', {
      'studentId': studentId,
      'leaveDate': leaveDateIso,
      'tripKind': tripKind,
      'reason': reason
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<List<dynamic>> getNotificationFeed() async {
    final payload = await _client.get('/alerts/feed') as Map<String, dynamic>;
    return (payload['alerts'] as List<dynamic>? ?? const []);
  }

  Future<Map<String, dynamic>> getProfile() async {
    final payload = await _client.get('/auth/me') as Map<String, dynamic>;
    return (payload['user'] as Map<String, dynamic>? ?? const <String, dynamic>{});
  }

  Future<Map<String, dynamic>> sendSos({
    required String message,
  }) async {
    final payload = await _client.post('/alerts/sos', {
      'message': message,
      'severity': 'critical',
      'type': 'sos'
    }) as Map<String, dynamic>;
    return payload;
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _client.post('/auth/change-password', {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    });
  }
}
