import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../../core/colors.dart';
import 'driver_api.dart';
import 'trip_dashboard.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> with SingleTickerProviderStateMixin {
  bool _loading = false;
  String? _error;
  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();

    // Auto-check for active trip on launch
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkForTrip();
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  DriverApi _buildApi() {
    final user = AppScope.of(context).currentUser!;
    return DriverApi(
      ApiClient(
        userId: user.id,
        accessToken: user.accessToken,
      ),
    );
  }

  Future<void> _checkForTrip() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = _buildApi();
      final payload = await api.getCurrentTrip();
      final trip = payload['trip'] as Map<String, dynamic>?;

      if (!mounted) return;

      if (trip == null) {
        setState(() {
          _loading = false;
          _error = null;
        });
        AppScope.of(context).setTrip(null);
        return;
      }

      final tripData = TripData(
        id: (trip['id'] ?? '').toString(),
        status: (trip['status'] ?? 'ready').toString(),
        routeName: trip['routeName'] as String?,
        driverName: trip['driverName'] as String?,
        studentCount: (trip['studentCount'] as int?) ?? 0,
        raw: trip,
      );
      AppScope.of(context).setTrip(tripData);
      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not check for trips. Pull down to retry.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final appState = AppScope.of(context);
    final user = appState.currentUser!;
    final trip = appState.currentTrip;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 20,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.orange, AppColors.orangeStrong],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Text(
              'SchoolBus',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
              ),
            ),
          ],
        ),
        actions: [
          // Profile badge
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: PopupMenuButton<String>(
              offset: const Offset(0, 44),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              itemBuilder: (context) => [
                PopupMenuItem(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.fullName,
                        style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Driver',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'signout',
                  child: Row(
                    children: [
                      Icon(Icons.logout_rounded, size: 18, color: Colors.red),
                      const SizedBox(width: 10),
                      const Text('Sign Out', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
              onSelected: (value) {
                if (value == 'signout') {
                  appState.signOut();
                }
              },
              child: CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.orange.withAlpha(20),
                child: Text(
                  user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'D',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.orange,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: trip != null
            ? TripDashboard(
                trip: trip,
                api: _buildApi(),
                onTripEnded: () {
                  AppScope.of(context).setTrip(null);
                  _checkForTrip();
                },
              )
            : _buildNoTripView(theme, isDark, user),
      ),
    );
  }

  Widget _buildNoTripView(ThemeData theme, bool isDark, LoggedInUser user) {
    return RefreshIndicator(
      onRefresh: _checkForTrip,
      color: AppColors.orange,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.08),

          // Welcome section
          Text(
            'Welcome back,',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
            ),
          ),
          Text(
            user.fullName,
            style: theme.textTheme.headlineLarge?.copyWith(
              fontWeight: FontWeight.w900,
              fontSize: 32,
            ),
          ),
          const SizedBox(height: 30),

          // Status card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(isDark ? 30 : 8),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.orange.withAlpha(15),
                    shape: BoxShape.circle,
                  ),
                  child: _loading
                      ? Padding(
                          padding: const EdgeInsets.all(22),
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            color: AppColors.orange,
                          ),
                        )
                      : Icon(
                          _error != null ? Icons.cloud_off_rounded : Icons.event_busy_rounded,
                          size: 34,
                          color: _error != null ? Colors.red : AppColors.orange,
                        ),
                ),
                const SizedBox(height: 18),
                Text(
                  _loading
                      ? 'Checking for trips...'
                      : (_error != null ? 'Connection Issue' : 'No Active Trip'),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _loading
                      ? 'Looking for your assigned trip...'
                      : (_error ?? 'You don\'t have any trips assigned right now. Pull down to check again.'),
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 22),
                if (!_loading)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: FilledButton.icon(
                      onPressed: _checkForTrip,
                      icon: const Icon(Icons.refresh_rounded, size: 20),
                      label: const Text('Check for Trip'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.orange,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Quick info cards
          Row(
            children: [
              Expanded(
                child: _InfoCard(
                  icon: Icons.gps_fixed_rounded,
                  label: 'GPS',
                  value: 'Ready',
                  color: Colors.green,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _InfoCard(
                  icon: Icons.wifi_rounded,
                  label: 'Network',
                  value: 'Online',
                  color: Colors.blue,
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
