import 'dart:async';
import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/marker_generator.dart';
import 'parent_api.dart';
import 'widgets/permission_guard.dart';
import '../../core/theme.dart';
import 'change_password_screen.dart';
import 'profile_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/colors.dart';
import '../../core/location_service.dart';
import 'package:geolocator/geolocator.dart' as geo;


class ParentHomeScreen extends StatefulWidget {
  const ParentHomeScreen({super.key});

  @override
  State<ParentHomeScreen> createState() => _ParentHomeScreenState();
}

class _ParentHomeScreenState extends State<ParentHomeScreen> {
  BitmapDescriptor? _busIcon;
  BitmapDescriptor? _schoolIcon;
  BitmapDescriptor? _homeIcon;

  @override
  void initState() {
    super.initState();
    _initIcons();
  }

  Future<void> _initIcons() async {
    // Use asset icons if possible
    BitmapDescriptor bus;
    try {
      bus = await BitmapDescriptor.asset(
        const ImageConfiguration(size: Size(48, 48)),
        'assets/images/bus_marker.png',
      );
    } catch (_) {
      bus = await MarkerGenerator.createMarkerFromEmoji('🚍');
    }
    
    BitmapDescriptor school;
    try {
      school = await BitmapDescriptor.asset(
        const ImageConfiguration(size: Size(48, 48)),
        'assets/images/school_marker.png',
      );
    } catch (_) {
      school = await MarkerGenerator.createMarkerFromEmoji('🏫');
    }

    BitmapDescriptor home;
    try {
      home = await BitmapDescriptor.asset(
        const ImageConfiguration(size: Size(48, 48)),
        'assets/images/home_marker.png',
      );
    } catch (_) {
      home = await MarkerGenerator.createMarkerFromEmoji('🏠');
    }

    if (mounted) {
      setState(() {
        _busIcon = bus;
        _schoolIcon = school;
        _homeIcon = home;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AppScope.of(context).currentUser!;
    final api =
        ParentApi(ApiClient(userId: user.id, accessToken: user.accessToken));

    return Scaffold(
      drawer: _buildDrawer(context),
      extendBodyBehindAppBar: true,
      backgroundColor: AppLightColors.scaffoldBackground,
      body: FutureBuilder<Map<String, dynamic>>(
        future: api.getCurrentTrip(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data ?? const <String, dynamic>{};
          final students = (data['students'] as List<dynamic>? ?? const []);
          final student = students.isNotEmpty ? students.first as Map<String, dynamic> : null;
          final trip = data['trip'] as Map<String, dynamic>?;

          return Stack(
            children: [
              CustomHeader(
                title: 'SchoolBus Tracker',
                onNotificationTap: () => _showNotifications(context, api),
              ),
              SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  children: [
                    const SizedBox(height: 160), // Spacing for header overlap
                    if (student != null) StudentProfileCard(student: student),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 32),
                          const SectionHeader(title: 'Quick Actions'),
                          const SizedBox(height: 16),
                          QuickActionsGrid(
                            api: api,
                            trip: trip,
                            student: student,
                            busIcon: _busIcon,
                            schoolIcon: _schoolIcon,
                            homeIcon: _homeIcon,
                          ),
                          const SizedBox(height: 32),
                          const SectionHeader(title: "Today's Status"),
                          const SizedBox(height: 16),
                          StatusCard(trip: trip),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    final theme = Theme.of(context);
    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: theme.colorScheme.primary),
            child: InkWell(
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
              },
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                     CircleAvatar(
                       radius: 30, 
                       backgroundColor: theme.colorScheme.onPrimary, 
                       child: Icon(Icons.person, size: 30, color: theme.colorScheme.primary),
                     ),
                     const SizedBox(height: 12),
                     Text(
                       AppScope.of(context).currentUser!.fullName, 
                       style: theme.textTheme.titleMedium?.copyWith(
                         color: theme.colorScheme.onPrimary, 
                         fontWeight: FontWeight.bold,
                       ),
                     ),
                  ],
                ),
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Change Password'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.palette_outlined),
            title: const Text('Change Theme'),
            onTap: () {
              Navigator.pop(context);
              AppScope.of(context).toggleThemeMode();
            },
          ),
          ListTile(
            leading: const Icon(Icons.support_agent_outlined),
            title: const Text('Contact Support'),
            onTap: () async {
              Navigator.pop(context);
              final Uri emailLaunchUri = Uri(
                scheme: 'mailto',
                path: 'support@suraksha.com',
                query: 'subject=Support Request from ${AppScope.of(context).currentUser!.fullName}',
              );
              try {
                if (await canLaunchUrl(emailLaunchUri)) {
                   await launchUrl(emailLaunchUri);
                }
              } catch (e) {
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(
                     const SnackBar(content: Text('Could not open email app')),
                   );
                }
              }
            },
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: Icon(Icons.logout, color: theme.colorScheme.error),
            title: Text('Sign Out', style: TextStyle(color: theme.colorScheme.error)),
            onTap: () {
              Navigator.pop(context);
              AppScope.of(context).signOut();
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  void _showNotifications(BuildContext context, ParentApi api) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => _NotificationsList(api: api),
    );
  }
}

class CustomHeader extends StatelessWidget {
  const CustomHeader({
    super.key,
    required this.title,
    required this.onNotificationTap,
  });

  final String title;
  final VoidCallback onNotificationTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      height: 200,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.orange, AppColors.orangeStrong],
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(40)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.menu, color: Colors.white),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
              Expanded(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Stack(
                children: [
                  IconButton(
                    onPressed: onNotificationTap,
                    icon: const Icon(Icons.notifications_active_outlined, color: Colors.white),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      child: const Text('2', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class StudentProfileCard extends StatelessWidget {
  const StudentProfileCard({super.key, required this.student});
  final Map<String, dynamic> student;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Hero(
                  tag: 'student_avatar',
                  child: CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.orange.withValues(alpha: 0.1),
                    child: const Icon(Icons.person, size: 40, color: AppColors.orange),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student['fullName'] ?? student['full_name'] ?? 'Student Name',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Class ${student['grade'] ?? student['class'] ?? '-'}',
                        style: theme.textTheme.bodyMedium?.copyWith(color: AppLightColors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const BadgeChip(label: 'Male', color: AppLightColors.accentSoft, textColor: AppColors.orange),
                          const SizedBox(width: 8),
                          BadgeChip(label: 'B+', color: Colors.red.shade50, textColor: Colors.red.shade900),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Divider(height: 1, thickness: 0.5),
            ),
            _buildInfoGrid([
              const InfoItem('Age', '12 years'),
              InfoItem('Admission No', student['admission_no'] ?? 'SCH2024001'),
              const InfoItem('Academic Year', '2024-2025'),
              const InfoItem('Blood Group', 'B+'),
              const InfoItem('Parent/Guardian', 'Rajesh Kumar'),
              const InfoItem('Contact', '+91 98765 43210'),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoGrid(List<Widget> children) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 2.8,
      crossAxisSpacing: 16,
      mainAxisSpacing: 12,
      padding: EdgeInsets.zero,
      children: children,
    );
  }
}

class BadgeChip extends StatelessWidget {
  const BadgeChip({super.key, required this.label, required this.color, required this.textColor});
  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.bold,
        fontSize: 20,
      ),
    );
  }
}

class InfoItem extends StatelessWidget {
  const InfoItem(this.label, this.value, {super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(color: AppLightColors.textSecondary),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({
    super.key,
    required this.api,
    this.trip,
    this.student,
    this.busIcon,
    this.schoolIcon,
    this.homeIcon,
  });
  final ParentApi api;
  final Map<String, dynamic>? trip;
  final Map<String, dynamic>? student;
  final BitmapDescriptor? busIcon;
  final BitmapDescriptor? schoolIcon;
  final BitmapDescriptor? homeIcon;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.1,
      padding: EdgeInsets.zero,
      children: [
        ActionCard(
          icon: Icons.location_on_outlined,
          label: 'Track Bus',
          subtitle: 'Live location',
          color: AppColors.trackBus,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _TrackingTab(
            api: api,
            busIcon: busIcon,
            schoolIcon: schoolIcon,
            homeIcon: homeIcon,
          ))),
        ),
        ActionCard(
          icon: Icons.calendar_today_outlined,
          label: 'Attendance',
          subtitle: 'Mark presence',
          color: AppColors.attendance,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _AttendanceTab(api: api, studentId: student?['id']?.toString()))),
        ),
        ActionCard(
          icon: Icons.person_outline,
          label: 'Driver Details',
          subtitle: 'Contact info',
          color: AppColors.driverDetails,
          onTap: () => _showDriverDetails(context),
        ),
        ActionCard(
          icon: Icons.directions_bus_outlined,
          label: 'Bus Info',
          subtitle: trip?['busLabel'] ?? trip?['bus_label'] ?? 'BUS-12',
          color: AppColors.orange,
          onTap: () {},
        ),
      ],
    );
  }

  void _showDriverDetails(BuildContext context) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Driver & Bus Info'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(radius: 40, backgroundColor: Colors.grey, child: Icon(Icons.person, size: 40)),
            const SizedBox(height: 16),
            Text(
              'Driver: ${trip?['driverName'] ?? trip?['driver_name'] ?? 'John Doe'}', 
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('License: ${trip?['driverLicenseNo'] ?? 'N/A'}'),
            const Divider(height: 32),
            Text('Bus: ${trip?['busLabel'] ?? trip?['bus_label'] ?? '12'}'),
            Text('Plate: ${trip?['busPlate'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (trip?['driverPhone'] != null)
              Text(
                'Phone: ${trip!['driverPhone']} (Calls may be disabled)', 
                style: theme.textTheme.labelSmall?.copyWith(fontStyle: FontStyle.italic),
              )
            else
              Text(
                'Phone calls to drivers are disabled.', 
                style: theme.textTheme.labelSmall?.copyWith(fontStyle: FontStyle.italic),
              ),
          ],
        ),
      ),
    );
  }
}

class ActionCard extends StatelessWidget {
  const ActionCard({
    super.key,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 24, color: color),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: theme.textTheme.labelSmall?.copyWith(color: AppLightColors.textSecondary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class StatusCard extends StatelessWidget {
  const StatusCard({super.key, this.trip});
  final Map<String, dynamic>? trip;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.directions_bus, color: AppColors.orange),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bus Status',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    trip?['status'] == 'active' 
                        ? 'Trip is currently active' 
                        : 'Waiting for trip to start',
                    style: theme.textTheme.bodyMedium?.copyWith(color: AppLightColors.textSecondary),
                  ),
                ],
              ),
            ),
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: trip?['status'] == 'active' ? Colors.green : Colors.grey.withValues(alpha: 0.3),
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationsList extends StatelessWidget {
  const _NotificationsList({required this.api});
  final ParentApi api;

  @override
  Widget build(BuildContext context) {
    final dashboard = DashboardTheme.of(context);
    final theme = Theme.of(context);
 
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Notifications', style: theme.textTheme.titleLarge),
        const SizedBox(height: 16),
        _buildNotificationTile('Bus arrival alert', 'Bus is arriving at your stop in 5 mins.', dashboard.trackBus),
        _buildNotificationTile('Delay / breakdown alert', 'Route 12 is delayed by 15 mins due to traffic.', theme.colorScheme.error),
        _buildNotificationTile('Route change notification', 'Main road closed, diverting via bypass.', dashboard.driverDetails),
        _buildNotificationTile('Bus reached your area', 'Bus has entered your neighborhood.', dashboard.attendance),
        _buildNotificationTile('Bus left school', 'The afternoon trip from school has started.', dashboard.notification),
      ],
    );
  }

  Widget _buildNotificationTile(String title, String message, Color color) {
    return ListTile(
      leading: CircleAvatar(backgroundColor: color.withAlpha(20), child: Icon(Icons.notification_important, color: color)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(message),
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
    );
  }
}

class _TrackingTab extends StatefulWidget {
  const _TrackingTab({
    required this.api,
    this.busIcon,
    this.schoolIcon,
    this.homeIcon,
  });

  final ParentApi api;
  final BitmapDescriptor? busIcon;
  final BitmapDescriptor? schoolIcon;
  final BitmapDescriptor? homeIcon;

  @override
  State<_TrackingTab> createState() => _TrackingTabState();
}

class _TrackingTabState extends State<_TrackingTab> {
  Timer? _refreshTimer;
  int _refreshTick = 0;
  late final Future<Map<String, dynamic>> _currentTripFuture;
  geo.Position? _userPosition;
  final _locationService = LocationService();
  GoogleMapController? _mapController;
  Map<String, dynamic>? _liveTripData;
  bool _isFirstLoad = true;
  String? _liveError;

  @override
  void initState() {
    super.initState();
    _currentTripFuture = widget.api.getCurrentTrip();
    _initInitialData();
    _updateUserLocation();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      final tripData = await _currentTripFuture;
      _onRefreshTick(tripData);
    });
  }

  Future<void> _goToMyLocation() async {
    if (_userPosition != null && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: LatLng(_userPosition!.latitude, _userPosition!.longitude),
            zoom: 16,
          ),
        ),
      );
    }
  }

  Future<void> _initInitialData() async {
    try {
      final tripData = await _currentTripFuture;
      final students = (tripData['students'] as List? ?? []);
      if (students.isNotEmpty) {
        final studentId = students.first['id'].toString();
        await _fetchLiveTripData(studentId);
      }
    } catch (e) {
      if (mounted) setState(() => _liveError = e.toString());
    } finally {
      if (mounted) setState(() => _isFirstLoad = false);
    }
  }

  Future<void> _fetchLiveTripData(String studentId) async {
    try {
      final data = await widget.api.getStudentLiveTrip(studentId);
      if (mounted) {
        setState(() {
          _liveTripData = data;
          _liveError = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _liveError = e.toString());
    }
  }

  Future<void> _updateUserLocation({bool updateState = true}) async {
    final pos = await _locationService.getCurrentPosition();
    if (updateState && mounted) {
      setState(() => _userPosition = pos);
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _onRefreshTick(Map<String, dynamic> tripData) async {
    if (!mounted) return;
    
    // Fetch all updates in parallel for efficiency
    final updates = await Future.wait([
      _locationService.getCurrentPosition(),
      () async {
        final students = (tripData['students'] as List? ?? []);
        if (students.isNotEmpty) {
          final studentId = students.first['id'].toString();
          try {
            return await widget.api.getStudentLiveTrip(studentId);
          } catch (_) {
            return null;
          }
        }
        return null;
      }(),
    ]);

    if (mounted) {
      setState(() {
        _userPosition = updates[0] as geo.Position?;
        if (updates[1] != null) {
          _liveTripData = updates[1] as Map<String, dynamic>?;
          _liveError = null;
        }
        _refreshTick += 1;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track Bus')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _currentTripFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) return const _LoadingPanel(title: 'Connecting to bus GPS');
          if (snapshot.hasError) return _ErrorPanel(error: snapshot.error.toString());

          final data = snapshot.data ?? const {};
          final trip = data['trip'] as Map<String, dynamic>?;
          final students = (data['students'] as List? ?? []);
          if (trip == null || students.isEmpty) return const _EmptyPanel(message: 'No live trip currently active for tracking.');

          if (_isFirstLoad && _liveTripData == null) {
            return const _LoadingPanel(title: 'Connecting to bus GPS');
          }

          if (_liveError != null && _liveTripData == null) {
            return _ErrorPanel(error: _liveError!);
          }

          final liveTrip = _liveTripData ?? {};
          final busLoc = liveTrip['busLocation'] as Map<String, dynamic>?;
          final studentStop = liveTrip['studentStop'] as Map<String, dynamic>?;
          final schoolLoc = liveTrip['schoolLocation'] as Map<String, dynamic>?;
          final eta = liveTrip['estimatedDropoffAt']?.toString() ?? 'Calculating...';
          
          final tripData = (liveTrip['trip'] as Map<String, dynamic>?) ?? trip;
          final isMoving = tripData['status'] == 'active' || tripData['status'] == 'paused';

          final lat = (busLoc?['latitude'] as num?)?.toDouble();
          final lng = (busLoc?['longitude'] as num?)?.toDouble();
          final stopLat = (studentStop?['latitude'] as num?)?.toDouble();
          final stopLng = (studentStop?['longitude'] as num?)?.toDouble();
          final schoolLat = (schoolLoc?['latitude'] as num?)?.toDouble();
          final schoolLng = (schoolLoc?['longitude'] as num?)?.toDouble();

          final centerLat = (isMoving ? lat : null) ?? schoolLat ?? stopLat ?? 0.0;
          final centerLng = (isMoving ? lng : null) ?? schoolLng ?? stopLng ?? 0.0;
          final hasMapCenter = centerLat != 0.0 || centerLng != 0.0;

          return PermissionGuard(
            child: Stack(
              children: [
                Column(
                  children: [
                    if (hasMapCenter)
                      Expanded(
                        child: GoogleMap(
                          key: const PageStorageKey('tracking_map'),
                          initialCameraPosition: CameraPosition(target: LatLng(centerLat, centerLng), zoom: 15),
                          myLocationEnabled: true,
                          myLocationButtonEnabled: false,
                          mapToolbarEnabled: false,
                              circles: {
                                if (_userPosition != null)
                                  Circle(
                                    circleId: const CircleId('user_location'),
                                    center: LatLng(_userPosition!.latitude, _userPosition!.longitude),
                                    radius: 150,
                                    fillColor: Colors.blue.withValues(alpha: 0.15),
                                    strokeColor: Colors.blue.withValues(alpha: 0.4),
                                    strokeWidth: 2,
                                  ),
                              },
                              markers: {
                                if (isMoving && lat != null && lng != null)
                                  Marker(markerId: const MarkerId('bus'), position: LatLng(lat, lng), icon: widget.busIcon ?? BitmapDescriptor.defaultMarker),
                                if (schoolLat != null && schoolLng != null)
                                  Marker(
                                    markerId: const MarkerId('school'), 
                                    position: LatLng(schoolLat, schoolLng), 
                                    icon: widget.schoolIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
                                  ),
                                if (stopLat != null && stopLng != null)
                                  Marker(
                                    markerId: const MarkerId('home'), 
                                    position: LatLng(stopLat, stopLng), 
                                    icon: widget.homeIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                                  ),
                              },
                              onMapCreated: (controller) => _mapController = controller,
                            ),
                          )
                        else
                          const Expanded(child: Center(child: Text('GPS signal searching...'))),
                        
                        _buildTripSummaryCard(trip, eta),
                      ],
                    ),
                    _buildEtaAlertBanner(eta, isMoving),
                    if (_userPosition != null)
                      Positioned(
                        right: 16,
                        bottom: 160, // Adjusted to be above the summary card
                        child: FloatingActionButton.small(
                          onPressed: _goToMyLocation,
                          backgroundColor: Colors.white,
                          child: const Icon(Icons.my_location, color: AppColors.orange),
                        ),
                      ),
                  ],
                ),
              );
        },
      ),
    );
  }

  Widget _buildEtaAlertBanner(String eta, bool isMoving) {
    final theme = Theme.of(context);
    
    if (!isMoving) {
      return Positioned(
        top: 16,
        left: 16,
        right: 16,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.orange.shade700,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 8)],
          ),
          child: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Trip has not started yet',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white, 
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Positioned(
      top: 16,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: theme.shadowColor.withValues(alpha: 0.1), blurRadius: 8)],
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: theme.colorScheme.onPrimary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Live ETA: [ bus will be arriving in 5 mins ]',
                style: TextStyle(
                  color: theme.colorScheme.onPrimary, 
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripSummaryCard(Map<String, dynamic> trip, String eta) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [BoxShadow(color: theme.shadowColor.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Route: ${trip['routeName']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  Text('Bus Label: ${trip['busLabel']}', style: const TextStyle(color: Colors.grey)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: DashboardTheme.of(context).attendance.withValues(alpha: 0.1), 
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'ACTIVE', 
                  style: TextStyle(
                    color: DashboardTheme.of(context).attendance, 
                    fontWeight: FontWeight.bold, 
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          _InfoCard(title: 'Estimated Arrival', body: 'Expected at home: $eta', icon: Icons.timer_outlined),
        ],
      ),
    );
  }
}

class _AttendanceTab extends StatefulWidget {
  const _AttendanceTab({required this.api, this.studentId});
  final ParentApi api;
  final String? studentId;

  @override
  State<_AttendanceTab> createState() => _AttendanceTabState();
}

class _AttendanceTabState extends State<_AttendanceTab> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  final Set<DateTime> _presentDates = {};
  final Set<DateTime> _absentDates = {};

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _presentDates.add(DateUtils.dateOnly(DateTime.now()));
    _fetchLeaveRequests();
  }

  Future<void> _fetchLeaveRequests() async {
    try {
      final leaves = await widget.api.getLeaveRequests();
      setState(() {
        _absentDates.clear();
        for (final leave in leaves) {
          final dateStr = leave['leaveDate'] ?? leave['leave_date'];
          if (dateStr != null) {
            _absentDates.add(DateUtils.dateOnly(DateTime.parse(dateStr.toString())));
          }
        }
      });
    } catch (e) {
      // Failed to sync leaves
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance Confirmation')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            TableCalendar(
              firstDay: DateTime.utc(2024, 1, 1),
              lastDay: DateTime.utc(2026, 12, 31),
              focusedDay: _focusedDay,
              selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
              calendarFormat: CalendarFormat.month,
              onDaySelected: (selectedDay, focusedDay) {
                final today = DateUtils.dateOnly(DateTime.now());
                final selectedDate = DateUtils.dateOnly(selectedDay);
                if (selectedDate.isBefore(today)) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('You can only mark attendance for today and future dates')),
                    );
                  }
                  return;
                }

                setState(() {
                  _selectedDay = selectedDay;
                  _focusedDay = focusedDay;
                });
                _showConfirmationPopup(selectedDay);
              },
              calendarStyle: CalendarStyle(
                todayDecoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.2), 
                  shape: BoxShape.circle,
                ),
                selectedDecoration: BoxDecoration(
                  color: theme.colorScheme.primary, 
                  shape: BoxShape.circle,
                ),
              ),
              calendarBuilders: CalendarBuilders(
                defaultBuilder: (context, day, focusedDay) {
                  final dateOnly = DateUtils.dateOnly(day);
                  final dashboard = DashboardTheme.of(context);
                  if (_presentDates.contains(dateOnly)) {
                    return _buildDayBox(day, dashboard.attendance);
                  }
                  if (_absentDates.contains(dateOnly)) {
                    return _buildDayBox(day, theme.colorScheme.error);
                  }
                  return null;
                },
              ),
            ),
            const Divider(height: 32),
            _buildPastEventsList(),
          ],
        ),
      ),
    );
  }

  Widget _buildDayBox(DateTime day, Color color) {
    return Container(
      margin: const EdgeInsets.all(4),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Text(
        '${day.day}', 
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      ),
    );
  }

  void _showConfirmationPopup(DateTime day) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Attendance'),
        content: Text('Is your child coming today (${day.day}/${day.month})?'),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              if (widget.studentId == null) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Student ID missing')));
                return;
              }
              try {
                await widget.api.submitLeaveRequest(
                  studentId: widget.studentId!,
                  leaveDateIso: day.toIso8601String(),
                  tripKind: 'pickup',
                  reason: 'Parent marked absent via calendar',
                );
                setState(() {
                  _absentDates.add(DateUtils.dateOnly(day));
                  _presentDates.remove(DateUtils.dateOnly(day));
                });
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Leave request successfully submitted')));
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to submit leave: $e')));
                }
              }
            },
            child: Text('NO', style: TextStyle(color: theme.colorScheme.error)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _presentDates.add(DateUtils.dateOnly(day));
                _absentDates.remove(DateUtils.dateOnly(day));
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: DashboardTheme.of(context).attendance,
              foregroundColor: Colors.white,
            ),
            child: const Text('YES'),
          ),
        ],
      ),
    );
  }

  Widget _buildPastEventsList() {
    return FutureBuilder<Map<String, dynamic>>(
      future: widget.api.getCurrentTrip(),
      builder: (context, tripSnapshot) {
        final students = (tripSnapshot.data?['students'] as List<dynamic>? ?? const []);
        if (students.isEmpty) return const SizedBox.shrink();

        final studentId = (students.first as Map<String, dynamic>)['id'].toString();

        return FutureBuilder<List<dynamic>>(
          future: widget.api.getAttendanceHistory(studentId),
          builder: (context, historySnapshot) {
            final history = historySnapshot.data ?? [];
            if (history.isEmpty) return const Padding(padding: EdgeInsets.all(20), child: Text('No past boarding events found.'));

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text('Recent History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: history.length,
                  itemBuilder: (context, index) {
                    final event = history[index] as Map<String, dynamic>;
                    return ListTile(
                      leading: Icon(
                        event['event_type'] == 'boarded' ? Icons.login : Icons.logout,
                        color: event['event_type'] == 'boarded' 
                            ? DashboardTheme.of(context).attendance 
                            : DashboardTheme.of(context).trackBus,
                      ),
                      title: Text((event['event_type'] ?? '-').toString().toUpperCase()),
                      subtitle: Text(event['recorded_at'].toString()),
                    );
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _LeaveTab extends StatefulWidget {
  const _LeaveTab({required this.api});

  final ParentApi api;

  @override
  State<_LeaveTab> createState() => _LeaveTabState();
}

class _LeaveTabState extends State<_LeaveTab> {
  final _reasonController = TextEditingController();
  String _tripKind = 'pickup';
  String _statusMessage = '';
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submitLeave(String studentId) async {
    final leaveDate = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
    ).toUtc().toIso8601String();
    try {
      await widget.api.submitLeaveRequest(
        studentId: studentId,
        leaveDateIso: leaveDate,
        tripKind: _tripKind,
        reason: _reasonController.text.trim().isEmpty
            ? null
            : _reasonController.text.trim(),
      );
      setState(() {
        _statusMessage = 'Leave request submitted successfully.';
      });
    } catch (error) {
      setState(() {
        _statusMessage = 'Unable to submit leave request. Please try again.';
      });
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate.isBefore(now) ? now : _selectedDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)),
    );
    if (picked == null || !mounted) {
      return;
    }
    setState(() {
      _selectedDate = picked;
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: widget.api.getCurrentTrip(),
      builder: (context, tripSnapshot) {
        if (tripSnapshot.connectionState != ConnectionState.done) {
          return const _LoadingPanel(title: 'Loading leave request form');
        }

        if (tripSnapshot.hasError) {
          return _ErrorPanel(error: tripSnapshot.error.toString());
        }

        final students =
            (tripSnapshot.data?['students'] as List<dynamic>? ?? const []);
        final studentId = students.isEmpty
            ? ''
            : ((students.first as Map<String, dynamic>)['id'] ?? '').toString();

        return FutureBuilder<List<dynamic>>(
          future: widget.api.getLeaveRequests(),
          builder: (context, leaveSnapshot) {
            final requests = leaveSnapshot.data ?? const [];
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              children: [
                _InfoCard(
                  title: 'Submit Leave',
                  body: 'Submit a planned leave for pickup, dropoff, or both.',
                  icon: Icons.event_note_outlined,
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        DropdownButtonFormField<String>(
                          initialValue: _tripKind,
                          items: const [
                            DropdownMenuItem(
                                value: 'pickup', child: Text('Pickup')),
                            DropdownMenuItem(
                                value: 'dropoff', child: Text('Dropoff')),
                            DropdownMenuItem(
                                value: 'both', child: Text('Both')),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _tripKind = value ?? 'pickup';
                            });
                          },
                          decoration:
                              const InputDecoration(labelText: 'Trip kind'),
                        ),
                        const SizedBox(height: 12),
                        InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: _pickDate,
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Leave date',
                              border: OutlineInputBorder(),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(_formatDate(_selectedDate)),
                                const Icon(Icons.calendar_today_outlined,
                                    size: 18),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _reasonController,
                          decoration: const InputDecoration(
                            labelText: 'Reason',
                            border: OutlineInputBorder(),
                          ),
                          maxLines: 2,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: studentId.isEmpty
                                ? null
                                : () => _submitLeave(studentId),
                            child: const Text('Submit Leave Request'),
                          ),
                        ),
                        if (_statusMessage.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            _statusMessage,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: _statusMessage
                                          .toLowerCase()
                                          .contains('success')
                                      ? Colors.green.shade700
                                      : Theme.of(context).colorScheme.error,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'Recent Requests',
                  body: '${requests.length} request(s) found for this parent.',
                  icon: Icons.history_outlined,
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _NotificationsTab extends StatefulWidget {
  const _NotificationsTab({required this.api});

  final ParentApi api;

  @override
  State<_NotificationsTab> createState() => _NotificationsTabState();
}

class _NotificationsTabState extends State<_NotificationsTab> {
  String _sosStatus = '';

  Future<void> _sendSos() async {
    try {
      await widget.api.sendSos(message: 'Parent triggered SOS from mobile app');
      setState(() {
        _sosStatus = 'SOS alert sent.';
      });
    } catch (error) {
      setState(() {
        _sosStatus = 'Unable to send SOS. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: widget.api.getNotificationFeed(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LoadingPanel(title: 'Loading notifications');
        }

        if (snapshot.hasError) {
          return _ErrorPanel(error: snapshot.error.toString());
        }

        final alerts = snapshot.data ?? const [];
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          children: [
            _InfoCard(
              title: 'Notification Feed',
              body: '${alerts.length} alert(s) received from school feed.',
              icon: Icons.notifications_active_outlined,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.tonal(
                onPressed: _sendSos,
                child: const Text('Send SOS'),
              ),
            ),
            if (_sosStatus.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_sosStatus),
            ],
            const SizedBox(height: 12),
            ...alerts.take(8).map((item) {
              final row = item as Map<String, dynamic>;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Card(
                  child: ListTile(
                    title: Text(
                        '${row['type'] ?? 'alert'} (${row['severity'] ?? '-'})'),
                    subtitle: Text('${row['message'] ?? '-'}'),
                    trailing: Text('${row['status'] ?? '-'}'),
                  ),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}


class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.body,
    required this.icon,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: theme.colorScheme.secondaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: theme.colorScheme.onSecondaryContainer),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
                  const SizedBox(height: 4),
                  Text(body, style: theme.textTheme.bodyLarge),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingPanel extends StatelessWidget {
  const _LoadingPanel({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.error});
  final String error;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, color: colorScheme.error, size: 30),
            const SizedBox(height: 8),
            Text('Something went wrong', style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(error, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inbox_outlined, size: 30),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

String _formatDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final year = date.year.toString();
  return '$day/$month/$year';
}
