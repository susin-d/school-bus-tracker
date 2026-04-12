import 'package:flutter/material.dart';

import 'core/app_scope.dart';
import 'core/app_state.dart';
import 'core/theme.dart';
import 'features/shell/app_router.dart';

class SurakshaApp extends StatefulWidget {
  const SurakshaApp({super.key});

  @override
  State<SurakshaApp> createState() => _SurakshaAppState();
}

class _SurakshaAppState extends State<SurakshaApp> {
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
        title: 'SURAKSHA Driver',
        theme: buildSurakshaLightTheme(),
        darkTheme: buildSurakshaDarkTheme(),
        themeMode: ThemeMode.system,
        home: const AppRouter(),
      ),
    );
  }
}
