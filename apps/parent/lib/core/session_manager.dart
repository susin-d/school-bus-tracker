import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_state.dart';
import 'api_access.dart';

class SessionManager {
  static const String _sessionKey = 'auth_session';

  Future<void> saveSession(LoggedInUser user) async {
    final prefs = await SharedPreferences.getInstance();
    final data = {
      'id': user.id,
      'fullName': user.fullName,
      'role': user.role.name,
      'accessToken': user.accessToken,
    };
    await prefs.setString(_sessionKey, jsonEncode(data));
  }

  Future<LoggedInUser?> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final sessionData = prefs.getString(_sessionKey);
    if (sessionData == null) return null;

    try {
      final data = jsonDecode(sessionData) as Map<String, dynamic>;
      return LoggedInUser(
        id: data['id'],
        fullName: data['fullName'],
        role: AppRole.values.byName(data['role']),
        accessToken: data['accessToken'],
      );
    } catch (e) {
      // If corruption or schema change, clear it
      await clearSession();
      return null;
    }
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }
}
