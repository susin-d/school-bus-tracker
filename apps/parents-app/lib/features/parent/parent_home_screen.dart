import 'dart:async';
import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/marker_generator.dart';
import 'parent_api.dart';
import 'widgets/permission_guard.dart';

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
    final bus = await MarkerGenerator.createMarkerFromEmoji('🚍');
    final school = await MarkerGenerator.createMarkerFromEmoji('🏫');
    final home = await MarkerGenerator.createMarkerFromEmoji('🏠');
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
      appBar: AppBar(
        title: const Text('SURAKSHA'),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () => _showNotifications(context, api),
            icon: const Icon(Icons.notifications_active_outlined),
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: api.getCurrentTrip(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data ?? const <String, dynamic>{};
          final students = (data['students'] as List<dynamic>? ?? const []);
          final student = students.isNotEmpty ? students.first as Map<String, dynamic> : null;

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (student != null) _StudentHeader(student: student),
              const SizedBox(height: 24),
              _ModuleGrid(
                api: api,
                student: student,
                busIcon: _busIcon,
                schoolIcon: _schoolIcon,
                homeIcon: _homeIcon,
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: theme.colorScheme.primary),
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
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Change Password'),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.palette_outlined),
            title: const Text('Change Theme'),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.support_agent_outlined),
            title: const Text('Contact Support'),
            onTap: () => Navigator.pop(context),
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

class _StudentHeader extends StatelessWidget {
  const _StudentHeader({required this.student});
  final Map<String, dynamic> student;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 4,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Icon(Icons.person, size: 40, color: theme.colorScheme.primary),
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
                      Text(
                        'Student', 
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: theme.colorScheme.primary, 
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 32),
            _buildInfoGrid([
              _InfoItem('Age', '14 Years'), // Placeholder as not in manifest
              _InfoItem('Class & Sec', '${student['grade'] ?? student['class'] ?? '-'}'),
              _InfoItem('Gender', 'Male'), // Placeholder
              _InfoItem('Admission No', student['admission_no'] ?? '-'),
              _InfoItem('Acad. Year', '2025-26'),
              _InfoItem('Blood Group', 'O+'),
              _InfoItem('Parent Name', 'Parent Name'),
              _InfoItem('Parent Mob', '9876543210'),
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
      childAspectRatio: 3.5,
      children: children,
    );
  }
}

class _InfoItem extends StatelessWidget {
  const _InfoItem(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelSmall),
        Text(value, style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }
}

class _ModuleGrid extends StatelessWidget {
  const _ModuleGrid({
    required this.api,
    this.student,
    this.busIcon,
    this.schoolIcon,
    this.homeIcon,
  });
  final ParentApi api;
  final Map<String, dynamic>? student;
  final BitmapDescriptor? busIcon;
  final BitmapDescriptor? schoolIcon;
  final BitmapDescriptor? homeIcon;

  @override
  Widget build(BuildContext context) {
    final dashboard = DashboardTheme.of(context);
 
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [
        _ModuleTile(
          icon: Icons.map_outlined,
          label: 'Track Bus',
          color: dashboard.trackBus,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _TrackingTab(
            api: api,
            busIcon: busIcon,
            schoolIcon: schoolIcon,
            homeIcon: homeIcon,
          ))),
        ),
        _ModuleTile(
          icon: Icons.calendar_today_outlined,
          label: 'Attendance',
          color: dashboard.attendance,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _AttendanceTab(api: api))),
        ),
        _ModuleTile(
          icon: Icons.assignment_ind_outlined,
          label: 'Driver Details',
          color: dashboard.driverDetails,
          onTap: () => _showDriverDetails(context),
        ),
        _ModuleTile(
          icon: Icons.event_note_outlined,
          label: 'Leave Request',
          color: dashboard.leaveRequest,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _LeaveTab(api: api))),
        ),
      ],
    );
  }

  void _showDriverDetails(BuildContext context) {
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
            const Text('Driver: John Doe', style: TextStyle(fontWeight: FontWeight.bold)),
            const Text('Age: 38'),
            const Divider(height: 32),
            const Text('Bus No: 12'),
            const Text('Plate: TN 01 AB 1234', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
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

class _ModuleTile extends StatelessWidget {
  const _ModuleTile({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withAlpha(50)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 12),
            Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
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

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (!mounted) return;
      setState(() => _refreshTick += 1);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track Bus')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: widget.api.getCurrentTrip(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) return const _LoadingPanel(title: 'Connecting to bus GPS');
          if (snapshot.hasError) return _ErrorPanel(error: snapshot.error.toString());

          final data = snapshot.data ?? const {};
          final trip = data['trip'] as Map<String, dynamic>?;
          final students = (data['students'] as List? ?? []);
          if (trip == null || students.isEmpty) return const _EmptyPanel(message: 'No live trip currently active for tracking.');

          final studentId = students.first['id'].toString();
          return FutureBuilder<Map<String, dynamic>>(
            key: ValueKey('live-$studentId-$_refreshTick'),
            future: widget.api.getStudentLiveTrip(studentId),
            builder: (context, liveSnapshot) {
              if (liveSnapshot.connectionState != ConnectionState.done) return const _LoadingPanel(title: 'Updating location');
              
              final liveTrip = liveSnapshot.data ?? {};
              final busLoc = liveTrip['busLocation'] as Map<String, dynamic>?;
              final studentStop = liveTrip['studentStop'] as Map<String, dynamic>?;
              final eta = liveTrip['estimatedDropoffAt']?.toString() ?? 'Calculating...';

              final lat = (busLoc?['latitude'] as num?)?.toDouble();
              final lng = (busLoc?['longitude'] as num?)?.toDouble();
              final stopLat = (studentStop?['latitude'] as num?)?.toDouble();
              final stopLng = (studentStop?['longitude'] as num?)?.toDouble();

              return PermissionGuard(
                child: Stack(
                  children: [
                    Column(
                      children: [
                        if (lat != null && lng != null)
                          Expanded(
                            child: GoogleMap(
                              initialCameraPosition: CameraPosition(target: LatLng(lat, lng), zoom: 15),
                              myLocationEnabled: true,
                              markers: {
                                Marker(markerId: const MarkerId('bus'), position: LatLng(lat, lng), icon: widget.busIcon ?? BitmapDescriptor.defaultMarker),
                                if (stopLat != null && stopLng != null)
                                  Marker(
                                    markerId: const MarkerId('home'), 
                                    position: LatLng(stopLat, stopLng), 
                                    icon: widget.homeIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                                  ),
                              },
                            ),
                          )
                        else
                          const Expanded(child: Center(child: Text('GPS signal searching...'))),
                        
                        _buildTripSummaryCard(trip, eta),
                      ],
                    ),
                    _buildEtaAlertBanner(eta),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEtaAlertBanner(String eta) {
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
  const _AttendanceTab({required this.api});
  final ParentApi api;

  @override
  State<_AttendanceTab> createState() => _AttendanceTabState();
}

class _AttendanceTabState extends State<_AttendanceTab> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  // Mock persistence for demo/requirement
  final Set<DateTime> _presentDates = {};
  final Set<DateTime> _absentDates = {};

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _presentDates.add(DateUtils.dateOnly(DateTime.now()));
  }

  @override
  Widget build(BuildContext context) {
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
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Attendance'),
        content: Text('Is your child coming today (${day.day}/${day.month})?'),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _absentDates.add(DateUtils.dateOnly(day));
                _presentDates.remove(DateUtils.dateOnly(day));
              });
              Navigator.pop(context);
            },
            child: Text('NO', style: TextStyle(color: theme.colorScheme.error)),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _presentDates.add(DateUtils.dateOnly(day));
                _absentDates.remove(DateUtils.dateOnly(day));
              });
              Navigator.pop(context);
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

class _EmptyInline extends StatelessWidget {
  const _EmptyInline({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(message, textAlign: TextAlign.center),
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
