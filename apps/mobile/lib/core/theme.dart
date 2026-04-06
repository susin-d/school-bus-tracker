import 'package:flutter/material.dart';

import 'colors.dart';

ThemeData buildSchoolBusLightTheme() {
  return ThemeData(
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.seed,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: AppLightColors.scaffoldBackground,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: AppLightColors.textPrimary,
    ),
    cardTheme: const CardThemeData(
      color: AppLightColors.panelBackground,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(24)),
        side: BorderSide(color: AppLightColors.panelBorder),
      ),
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppLightColors.textPrimary),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppLightColors.textPrimary),
      bodyLarge: TextStyle(fontSize: 16, height: 1.5, color: AppLightColors.textSecondary),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: AppLightColors.textSecondary),
      labelLarge: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2),
    ),
  );
}

ThemeData buildSchoolBusDarkTheme() {
  return ThemeData(
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.seed,
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: AppDarkColors.scaffoldBackground,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: AppDarkColors.textPrimary,
    ),
    cardTheme: const CardThemeData(
      color: AppDarkColors.panelBackground,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(24)),
        side: BorderSide(color: AppDarkColors.panelBorder),
      ),
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppDarkColors.textPrimary),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppDarkColors.textPrimary),
      bodyLarge: TextStyle(fontSize: 16, height: 1.5, color: AppDarkColors.textSecondary),
      bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: AppDarkColors.textSecondary),
      labelLarge: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2),
    ),
  );
}
