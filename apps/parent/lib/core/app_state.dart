import 'package:flutter/material.dart';

import 'api_access.dart';
import 'session_manager.dart';

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

class AppState extends ChangeNotifier {
  final _sessionManager = SessionManager();
  LoggedInUser? _currentUser;
  ThemeMode _themeMode = ThemeMode.system;
  bool _isInit = false;

  bool get isInit => _isInit;

  ThemeMode get themeMode => _themeMode;


  LoggedInUser? get currentUser => _currentUser;

  bool get isLoggedIn => _currentUser != null;

  Future<void> loadSession() async {
    _currentUser = await _sessionManager.loadSession();
    _isInit = true;
    notifyListeners();
  }

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
    _sessionManager.saveSession(_currentUser!);
    notifyListeners();
  }

  void signOut() {
    _currentUser = null;
    _sessionManager.clearSession();
    notifyListeners();
  }

  void toggleThemeMode() {
    if (_themeMode == ThemeMode.light) {
      _themeMode = ThemeMode.dark;
    } else {
      _themeMode = ThemeMode.light;
    }
    notifyListeners();
  }
}
