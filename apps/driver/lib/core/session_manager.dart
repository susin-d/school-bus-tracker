import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_state.dart';

class SessionManager {
  static const String _sessionKey = 'auth_session_driver';

  bool _isJwtExpiredOrInvalid(String? token) {
    final raw = token?.trim() ?? '';
    if (raw.isEmpty) return true;

    final parts = raw.split('.');
    if (parts.length < 2) return true;

    try {
      final normalized = base64Url.normalize(parts[1]);
      final payload = jsonDecode(utf8.decode(base64Url.decode(normalized))) as Map<String, dynamic>;
      final exp = payload['exp'];
      if (exp is num) {
        final expiryMs = exp.toInt() * 1000;
        return DateTime.now().millisecondsSinceEpoch >= expiryMs;
      }

      // If token has no exp claim, treat it as invalid for safety.
      return true;
    } catch (_) {
      return true;
    }
  }

  Future<void> saveSession(LoggedInUser user) async {
    final prefs = await SharedPreferences.getInstance();
    final data = {
      'id': user.id,
      'fullName': user.fullName,
      'role': user.role.name,
      'accessToken': user.accessToken,
      'gender': user.gender,
      'dateOfBirth': user.dateOfBirth,
      'assignedBusId': user.assignedBusId,
      'busLabel': user.busLabel,
      'busPlate': user.busPlate,
    };
    await prefs.setString(_sessionKey, jsonEncode(data));
  }

  Future<LoggedInUser?> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final sessionData = prefs.getString(_sessionKey);
    if (sessionData == null) return null;

    try {
      final data = jsonDecode(sessionData) as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String?;

      if (_isJwtExpiredOrInvalid(accessToken)) {
        await clearSession();
        return null;
      }

      return LoggedInUser(
        id: data['id'],
        fullName: data['fullName'],
        role: AppRole.values.byName(data['role']),
        accessToken: accessToken,
        gender: data['gender'],
        dateOfBirth: data['dateOfBirth'],
        assignedBusId: data['assignedBusId'],
        busLabel: data['busLabel'],
        busPlate: data['busPlate'],
      );
    } catch (e) {
      await clearSession();
      return null;
    }
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }
}
