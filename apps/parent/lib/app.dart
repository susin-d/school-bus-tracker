import 'package:flutter/material.dart';

import 'core/app_scope.dart';
import 'core/app_state.dart';
import 'core/theme.dart';
import 'features/shell/app_router.dart';

class SchoolBusApp extends StatefulWidget {
  const SchoolBusApp({super.key});

  @override
  State<SchoolBusApp> createState() => _SchoolBusAppState();
}

class _SchoolBusAppState extends State<SchoolBusApp> {
  late final AppState _appState;

  @override
  void initState() {
    super.initState();
    _appState = AppState();
  }

  @override
  void dispose() {
    _appState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      appState: _appState,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'SURAKSHA',
        theme: buildSchoolBusLightTheme(),
        darkTheme: buildSchoolBusDarkTheme(),
        themeMode: _appState.themeMode,
        home: const AppRouter(),
      ),
    );
  }
}
