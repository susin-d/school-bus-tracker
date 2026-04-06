import 'package:flutter/material.dart';

import '../../core/api_access.dart';
import '../../core/app_scope.dart';
import '../auth/login_screen.dart';
import '../driver/driver_home_screen.dart';
import '../parent/parent_home_screen.dart';

class AppRouter extends StatelessWidget {
  const AppRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppScope.of(context);
    final currentUser = appState.currentUser;

    if (currentUser == null) {
      return const LoginScreen();
    }

    switch (currentUser.role) {
      case AppRole.parent:
        return const ParentHomeScreen();
      case AppRole.driver:
        return const DriverHomeScreen();
    }
  }
}
