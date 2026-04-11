import 'package:flutter/material.dart';

import 'api_access.dart';

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
  LoggedInUser? _currentUser;
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;


  LoggedInUser? get currentUser => _currentUser;

  bool get isLoggedIn => _currentUser != null;

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
