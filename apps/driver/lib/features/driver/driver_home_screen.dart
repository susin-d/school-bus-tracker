import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../../core/colors.dart';
import 'driver_api.dart';
import 'active_trip_screen.dart';
import 'announcement_screen.dart';
import 'student_list_screen.dart';
import '../../widgets/app_drawer.dart';

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
          busNo: trip['busNo'] as String? ?? 'BUS001',
          plateNumber: trip['plateNumber'] as String? ?? 'TN 09 AB 1234',
          driverPhone: trip['driverPhone'] as String? ?? '+91 98765 12345',
          raw: trip,
        );
        AppScope.of(context).setTrip(tripData);
      } else {
        // Use placeholders if no active trip to show UI layout
        AppScope.of(context).setTrip(const TripData(
          id: 'dummy',
          status: 'ready',
          busNo: 'BUS001',
          plateNumber: 'TN 09 AB 1234',
          driverPhone: '+91 98765 12345',
        ));
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
      backgroundColor: isDark ? AppDarkColors.scaffoldBackground : const Color(0xFFFBFBFB),
      drawer: const AppDrawer(),
      appBar: AppBar(
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: AppColors.surakshaOrangeGradient,
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
          ),
        ),
        title: const Text(
          'Suraksha Driver',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            onPressed: _checkForTrip,
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _checkForTrip,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                children: [
                  // Profile Card
                  _DriverProfileCard(user: user, trip: trip, isDark: isDark),
                  const SizedBox(height: 32),

                  const Text(
                    'Quick Actions',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 16),

                  // Action Grid
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 0.85,
                    children: [
                      _QuickActionCard(
                        title: 'Start Trip',
                        subtitle: 'Begin route',
                        icon: Icons.navigation_rounded,
                        color: AppColors.orange,
                        isDark: isDark,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ActiveTripScreen()),
                        ).then((_) => _checkForTrip()),
                      ),
                      _QuickActionCard(
                        title: 'Announce',
                        subtitle: 'Send alerts',
                        icon: Icons.campaign_rounded,
                        color: Colors.redAccent,
                        isDark: isDark,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AnnouncementScreen()),
                        ),
                      ),
                      _QuickActionCard(
                        title: 'Students',
                        subtitle: '${trip?.studentCount ?? 4} assigned',
                        icon: Icons.people_alt_rounded,
                        color: Colors.indigoAccent,
                        isDark: isDark,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const StudentListScreen()),
                        ),
                      ),
                      _QuickActionCard(
                        title: 'Bus Info',
                        subtitle: trip?.plateNumber ?? 'TN 09 AB 1234',
                        icon: Icons.directions_bus_rounded,
                        color: Colors.teal,
                        isDark: isDark,
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Vehicle details: Ashok Leyland 2024 Model')),
                          );
                        },
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}

class _DriverProfileCard extends StatelessWidget {
  const _DriverProfileCard({required this.user, required this.trip, required this.isDark});
  final LoggedInUser user;
  final TripData? trip;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppDarkColors.panelBackground : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(isDark ? 50 : 10),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.grey.withAlpha(30),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.person, size: 40, color: Colors.grey),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.fullName,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      const Text(
                        'Driver',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _Tag(
                            label: user.gender != null ? (user.gender![0].toUpperCase() + user.gender!.substring(1)) : 'Male',
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _Tag(
                            label: user.age != null ? '${user.age} yrs' : '42 yrs',
                            isDark: isDark,
                          ),
                        ],
                      ),

                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                _InfoItem(
                  icon: Icons.directions_bus_filled_rounded,
                  label: 'Bus No',
                  value: trip?.busNo ?? 'BUS001',
                  color: Colors.amber,
                  isDark: isDark,
                ),
                const Spacer(),
                _InfoItem(
                  icon: Icons.phone_rounded,
                  label: 'Contact',
                  value: trip?.driverPhone ?? '+91 98765 12345',
                  color: Colors.green,
                  isDark: isDark,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.isDark});
  final String label;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withAlpha(20) : Colors.grey.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  const _InfoItem({
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
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withAlpha(20),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.isDark,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isDark ? AppDarkColors.panelBackground : Colors.white,
      borderRadius: BorderRadius.circular(24),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.withAlpha(20)),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const Spacer(),
              Text(
                title,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

