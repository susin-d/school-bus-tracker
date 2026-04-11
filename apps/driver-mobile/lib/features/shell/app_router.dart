import 'package:flutter/material.dart';

import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../auth/login_screen.dart';
import '../driver/driver_home_screen.dart';

class AppRouter extends StatelessWidget {
  const AppRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppScope.of(context);
    final currentUser = appState.currentUser;

    if (currentUser == null) {
      return const LoginScreen();
    }

    if (currentUser.role == AppRole.driver) {
      return const DriverHomeScreen();
    }

    return const LoginScreen();
  }
}
