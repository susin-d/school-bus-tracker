import 'package:flutter/material.dart';

import 'colors.dart';

ThemeData buildSchoolBusLightTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.seed,
    brightness: Brightness.light,
  ).copyWith(
    primary: AppColors.orange,
    onPrimary: Colors.white,
    secondary: AppColors.orangeStrong,
    onSecondary: Colors.white,
    tertiary: AppColors.brown,
    error: AppColors.alert,
    surface: AppLightColors.scaffoldBackground,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppLightColors.scaffoldBackground,
    extensions: [
      DashboardTheme(
        trackBus: AppColors.trackBus,
        attendance: AppColors.attendance,
        driverDetails: AppColors.driverDetails,
        leaveRequest: AppColors.leaveRequest,
        notification: AppColors.notification,
      ),
    ],
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      foregroundColor: AppLightColors.textPrimary,
      iconTheme: IconThemeData(color: AppColors.orange),
    ),
    cardTheme: CardThemeData(
      color: AppLightColors.panelBackground,
      elevation: 4,
      shadowColor: AppColors.orange.withAlpha(20),
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        side: BorderSide(color: AppColors.orange.withAlpha(40)),
      ),
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: AppLightColors.textPrimary),
      titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppLightColors.textPrimary),
      bodyLarge: TextStyle(
          fontSize: 16, height: 1.5, color: AppLightColors.textSecondary),
      bodyMedium: TextStyle(
          fontSize: 14, height: 1.5, color: AppLightColors.textSecondary),
      labelLarge: TextStyle(
          fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppLightColors.panelBackground,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppLightColors.panelBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppLightColors.panelBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.primary, width: 2.0),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.orange,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 2,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 80,
      backgroundColor: Colors.white,
      indicatorColor: AppColors.orange.withAlpha(30),
      indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: AppColors.orange, size: 28);
        }
        return const IconThemeData(color: AppLightColors.textSecondary, size: 24);
      }),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
          color: selected
              ? AppColors.orange
              : AppLightColors.textSecondary,
        );
      }),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.orange,
      foregroundColor: Colors.white,
    ),
  );
}

ThemeData buildSchoolBusDarkTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.seed,
    brightness: Brightness.dark,
  ).copyWith(
    primary: AppColors.orange,
    secondary: const Color(0xFFFF9E57),
    tertiary: AppColors.orangeStrong,
    error: AppColors.alert,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppDarkColors.scaffoldBackground,
    extensions: [
      DashboardTheme(
        trackBus: AppColors.trackBus.withValues(alpha: 0.8),
        attendance: AppColors.attendance.withValues(alpha: 0.8),
        driverDetails: AppColors.driverDetails,
        leaveRequest: AppColors.leaveRequest.withValues(alpha: 0.8),
        notification: AppColors.notification.withValues(alpha: 0.8),
      ),
    ],
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
      headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: AppDarkColors.textPrimary),
      titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppDarkColors.textPrimary),
      bodyLarge: TextStyle(
          fontSize: 16, height: 1.5, color: AppDarkColors.textSecondary),
      bodyMedium: TextStyle(
          fontSize: 14, height: 1.5, color: AppDarkColors.textSecondary),
      labelLarge: TextStyle(
          fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppDarkColors.panelBackground,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppDarkColors.panelBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppDarkColors.panelBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.primary, width: 1.6),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      indicatorColor: AppDarkColors.accentSoft,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected
              ? AppDarkColors.textPrimary
              : AppDarkColors.textSecondary,
        );
      }),
    ),
  );
}

class DashboardTheme extends ThemeExtension<DashboardTheme> {
  const DashboardTheme({
    required this.trackBus,
    required this.attendance,
    required this.driverDetails,
    required this.leaveRequest,
    required this.notification,
  });

  final Color trackBus;
  final Color attendance;
  final Color driverDetails;
  final Color leaveRequest;
  final Color notification;

  @override
  DashboardTheme copyWith({
    Color? trackBus,
    Color? attendance,
    Color? driverDetails,
    Color? leaveRequest,
    Color? notification,
  }) {
    return DashboardTheme(
      trackBus: trackBus ?? this.trackBus,
      attendance: attendance ?? this.attendance,
      driverDetails: driverDetails ?? this.driverDetails,
      leaveRequest: leaveRequest ?? this.leaveRequest,
      notification: notification ?? this.notification,
    );
  }

  @override
  DashboardTheme lerp(ThemeExtension<DashboardTheme>? other, double t) {
    if (other is! DashboardTheme) return this;
    return DashboardTheme(
      trackBus: Color.lerp(trackBus, other.trackBus, t)!,
      attendance: Color.lerp(attendance, other.attendance, t)!,
      driverDetails: Color.lerp(driverDetails, other.driverDetails, t)!,
      leaveRequest: Color.lerp(leaveRequest, other.leaveRequest, t)!,
      notification: Color.lerp(notification, other.notification, t)!,
    );
  }

  static DashboardTheme of(BuildContext context) {
    return Theme.of(context).extension<DashboardTheme>()!;
  }
}
