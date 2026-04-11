import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../../core/colors.dart';
import 'driver_api.dart';
import 'active_trip_screen.dart';
import 'announcement_screen.dart';
import 'student_list_screen.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _checkForTrip();
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
    setState(() => _loading = true);
    try {
      final api = _buildApi();
      final payload = await api.getCurrentTrip();
      final trip = payload['trip'] as Map<String, dynamic>?;

      if (!mounted) return;

      if (trip != null) {
        final tripData = TripData(
          id: (trip['id'] ?? '').toString(),
          status: (trip['status'] ?? 'ready').toString(),
          routeName: trip['routeName'] as String?,
          driverName: trip['driverName'] as String?,
          studentCount: (trip['studentCount'] as int?) ?? 0,
          raw: trip,
        );
        AppScope.of(context).setTrip(tripData);
      } else {
        AppScope.of(context).setTrip(null);
      }
    } catch (_) {
      // Background check, silenty fail
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final user = AppScope.of(context).currentUser!;
    final trip = AppScope.of(context).currentTrip;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Dashboard', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: () => AppScope.of(context).signOut(),
            icon: const Icon(Icons.logout_rounded, color: Colors.red),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _checkForTrip,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  // Welcome Card
                  _WelcomeHeader(user: user, isDark: isDark),
                  const SizedBox(height: 32),

                  // Active Trip Summary (if any)
                  if (trip != null) ...[
                    _ActiveTripBanner(trip: trip, isDark: isDark),
                    const SizedBox(height: 24),
                  ],

                  // Module Grid
                  Row(
                    children: [
                      Expanded(
                        child: _ModuleCard(
                          title: 'Start Trip',
                          icon: Icons.map_rounded,
                          color: Colors.green,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const ActiveTripScreen()),
                          ).then((_) => _checkForTrip()),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _ModuleCard(
                          title: 'Announce',
                          icon: Icons.campaign_rounded,
                          color: Colors.orange,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const AnnouncementScreen()),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _ModuleCard(
                    title: 'Students List',
                    icon: Icons.groups_rounded,
                    color: Colors.blue,
                    isDark: isDark,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const StudentListScreen()),
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }
}

class _WelcomeHeader extends StatelessWidget {
  const _WelcomeHeader({required this.user, required this.isDark});
  final LoggedInUser user;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Hello,',
          style: TextStyle(
            fontSize: 16,
            color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
          ),
        ),
        Text(
          user.fullName,
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
        ),
      ],
    );
  }
}

class _ActiveTripBanner extends StatelessWidget {
  const _ActiveTripBanner({required this.trip, required this.isDark});
  final TripData trip;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final isActive = trip.status == 'active';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isActive ? Colors.green.withAlpha(20) : Colors.blue.withAlpha(20),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: (isActive ? Colors.green : Colors.blue).withAlpha(50)),
      ),
      child: Row(
        children: [
          Icon(isActive ? Icons.directions_bus : Icons.schedule, color: isActive ? Colors.green : Colors.blue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isActive ? 'Active Trip' : 'Upcoming Trip',
                  style: TextStyle(fontWeight: FontWeight.w800, color: isActive ? Colors.green : Colors.blue),
                ),
                Text(trip.routeName ?? 'Route assigned', style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.isDark,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final Color color;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
      borderRadius: BorderRadius.circular(24),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          height: 140,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            border: Border.all(color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              Text(
                title,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
