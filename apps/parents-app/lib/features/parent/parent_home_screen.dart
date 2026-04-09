import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/api_access.dart';
import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import 'parent_api.dart';

bool _isWidgetTestRuntime() {
  return Platform.environment.containsKey('FLUTTER_TEST');
}

class ParentHomeScreen extends StatefulWidget {
  const ParentHomeScreen({super.key});

  @override
  State<ParentHomeScreen> createState() => _ParentHomeScreenState();
}

class _ParentHomeScreenState extends State<ParentHomeScreen> {
  int _tabIndex = 0;
  static const _tabTitles = <String>[
    'Overview',
    'Live Tracking',
    'Attendance',
    'Leave',
    'Alerts',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    final user = AppScope.of(context).currentUser!;
    final api =
        ParentApi(ApiClient(userId: user.id, accessToken: user.accessToken));

    final tabs = <Widget>[
      _HomeTab(api: api, fullName: user.fullName),
      _TrackingTab(api: api),
      _AttendanceTab(api: api),
      _LeaveTab(api: api),
      _NotificationsTab(api: api),
      _ProfileTab(api: api, fullName: user.fullName),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_tabTitles[_tabIndex]),
            Text(
              user.fullName,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => AppScope.of(context).signOut(),
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: KeyedSubtree(
          key: ValueKey<int>(_tabIndex),
          child: tabs[_tabIndex],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (value) => setState(() => _tabIndex = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.map_outlined), label: 'Tracking'),
          NavigationDestination(
              icon: Icon(Icons.fact_check_outlined), label: 'Attendance'),
          NavigationDestination(
              icon: Icon(Icons.event_note_outlined), label: 'Leave'),
          NavigationDestination(
              icon: Icon(Icons.notifications_none), label: 'Alerts'),
          NavigationDestination(
              icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.api,
    required this.fullName,
  });

  final ParentApi api;
  final String fullName;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: api.getCurrentTrip(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LoadingPanel(title: 'Loading current trip');
        }

        if (snapshot.hasError) {
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            children: [
              _HeroCard(
                title: 'Welcome, $fullName',
                subtitle:
                    'Your school updates will appear here when connectivity is restored.',
                icon: Icons.family_restroom_outlined,
              ),
              const SizedBox(height: 12),
              _InfoCard(
                title: 'Current Trip',
                body: 'Live trip data is currently unavailable.',
                icon: Icons.directions_bus_filled_outlined,
              ),
              const SizedBox(height: 12),
              _InfoCard(
                title: 'Assigned Students',
                body: 'Student assignments could not be loaded.',
                icon: Icons.groups_2_outlined,
              ),
              const SizedBox(height: 12),
              const _InfoCard(
                title: 'Last Location',
                body: 'Location unavailable while offline.',
                icon: Icons.location_on_outlined,
              ),
              const SizedBox(height: 14),
              const _EndpointList(endpoints: [
                AppApiEndpoint.currentTrip,
                AppApiEndpoint.tripLocation,
                AppApiEndpoint.studentAttendanceHistory,
                AppApiEndpoint.leaveRequests,
                AppApiEndpoint.alertSos,
                AppApiEndpoint.notificationsFeed,
                AppApiEndpoint.profile,
              ]),
            ],
          );
        }

        final data = snapshot.data ?? const <String, dynamic>{};
        final trip = data['trip'] as Map<String, dynamic>?;
        final students = data['students'] as List<dynamic>? ?? const [];
        final location = data['lastLocation'] as Map<String, dynamic>?;
        final routeName = (trip?['routeName'] ?? '-').toString();
        final tripStatus = (trip?['status'] ?? 'No active trip').toString();

        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          children: [
            _HeroCard(
              title: 'Welcome, $fullName',
              subtitle: 'Route $routeName • $tripStatus',
              icon: Icons.family_restroom_outlined,
            ),
            const SizedBox(height: 12),
            _InfoCard(
              title: 'Current Trip',
              body: trip == null
                  ? 'No active trip is assigned right now.'
                  : 'Route: ${trip['routeName'] ?? '-'} | Bus: ${trip['busLabel'] ?? '-'} | Status: ${trip['status'] ?? '-'}',
              icon: Icons.directions_bus_filled_outlined,
            ),
            const SizedBox(height: 12),
            _InfoCard(
              title: 'Assigned Students',
              body: students.isEmpty
                  ? 'No student linked to an active trip.'
                  : students
                      .map((item) =>
                          (item as Map<String, dynamic>)['fullName'] ?? '-')
                      .join(', '),
              icon: Icons.groups_2_outlined,
            ),
            const SizedBox(height: 12),
            _InfoCard(
              title: 'Last Location',
              body: location == null
                  ? 'Location not available.'
                  : 'Lat: ${location['latitude']} | Lng: ${location['longitude']}',
              icon: Icons.location_on_outlined,
            ),
            const SizedBox(height: 12),
            if (students.isNotEmpty)
              FutureBuilder<Map<String, dynamic>>(
                future: api.getStudentLiveTrip(
                  ((students.first as Map<String, dynamic>)['id'] ?? '')
                      .toString(),
                ),
                builder: (context, liveTripSnapshot) {
                  final liveTrip =
                      liveTripSnapshot.data ?? const <String, dynamic>{};
                  final eta = liveTrip['estimatedDropoffAt']?.toString();
                  final studentStop =
                      liveTrip['studentStop'] as Map<String, dynamic>?;
                  final stopStatus =
                      studentStop?['stopStatus']?.toString() ?? 'scheduled';
                  return _InfoCard(
                    title: 'Estimated Dropoff',
                    body: eta == null
                        ? 'ETA is not ready yet.'
                        : 'ETA: $eta | Stop status: $stopStatus',
                    icon: Icons.schedule_outlined,
                  );
                },
              ),
            const SizedBox(height: 14),
            _EndpointList(
                endpoints: RoleApiAccess.allowedEndpoints(AppRole.parent)),
          ],
        );
      },
    );
  }
}

class _TrackingTab extends StatefulWidget {
  const _TrackingTab({required this.api});

  final ParentApi api;

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
      if (!mounted) {
        return;
      }
      setState(() {
        _refreshTick += 1;
      });
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: widget.api.getCurrentTrip(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LoadingPanel(title: 'Loading tracking view');
        }

        if (snapshot.hasError) {
          return _ErrorPanel(error: snapshot.error.toString());
        }

        final data = snapshot.data ?? const <String, dynamic>{};
        final trip = data['trip'] as Map<String, dynamic>?;
        final students = (data['students'] as List<dynamic>? ?? const []);
        if (trip == null) {
          return const _EmptyPanel(
              message: 'No active trip available for tracking.');
        }

        if (students.isEmpty) {
          return const _EmptyPanel(
              message: 'No linked student found to calculate live ETA.');
        }

        final studentId =
            ((students.first as Map<String, dynamic>)['id'] ?? '').toString();
        return FutureBuilder<Map<String, dynamic>>(
          key: ValueKey<String>('live-trip-$studentId-$_refreshTick'),
          future: widget.api.getStudentLiveTrip(studentId),
          builder: (context, liveSnapshot) {
            if (liveSnapshot.connectionState != ConnectionState.done) {
              return const _LoadingPanel(title: 'Loading live student trip');
            }

            if (liveSnapshot.hasError) {
              return _ErrorPanel(error: liveSnapshot.error.toString());
            }

            final liveTrip = liveSnapshot.data ?? const <String, dynamic>{};
            final busLocation =
                liveTrip['busLocation'] as Map<String, dynamic>?;
            final nextStop = liveTrip['nextStop'] as Map<String, dynamic>?;
            final studentStop =
                liveTrip['studentStop'] as Map<String, dynamic>?;
            final latitude = (busLocation?['latitude'] as num?)?.toDouble();
            final longitude = (busLocation?['longitude'] as num?)?.toDouble();
            final nextStopLat = (nextStop?['latitude'] as num?)?.toDouble();
            final nextStopLng = (nextStop?['longitude'] as num?)?.toDouble();
            final studentStopLat =
                (studentStop?['latitude'] as num?)?.toDouble();
            final studentStopLng =
                (studentStop?['longitude'] as num?)?.toDouble();

            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              children: [
                _InfoCard(
                  title: 'Trip Snapshot',
                  body: 'Route ${trip['routeName']} | Status ${trip['status']}',
                  icon: Icons.route_outlined,
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'Driver',
                  body: '${trip['driverName'] ?? '-'}',
                  icon: Icons.person_pin_circle_outlined,
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'ETA',
                  body: liveTrip['estimatedDropoffAt'] == null
                      ? 'Dropoff ETA unavailable right now.'
                      : 'Estimated dropoff at ${liveTrip['estimatedDropoffAt']}',
                  icon: Icons.schedule_outlined,
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'Live Refresh',
                  body:
                      'Auto-refreshing every 10 seconds for realtime ETA and location updates.',
                  icon: Icons.sync_outlined,
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'Next Stop',
                  body: nextStop == null
                      ? 'No upcoming stop.'
                      : '${nextStop['studentName'] ?? nextStop['addressText'] ?? 'Stop'} | ETA ${nextStop['currentEta'] ?? nextStop['plannedEta'] ?? '-'}',
                  icon: Icons.flag_outlined,
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'Student Stop Status',
                  body: studentStop == null
                      ? 'No student-specific stop mapped yet.'
                      : '${studentStop['stopStatus'] ?? 'scheduled'}',
                  icon: Icons.badge_outlined,
                ),
                const SizedBox(height: 12),
                if (latitude != null && longitude != null)
                  SizedBox(
                    height: 220,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: _isWidgetTestRuntime()
                          ? const _InfoCard(
                              title: 'Map preview',
                              body:
                                  'Google Map is disabled during widget tests.',
                              icon: Icons.map_outlined,
                            )
                          : GoogleMap(
                              initialCameraPosition: CameraPosition(
                                target: LatLng(latitude, longitude),
                                zoom: 14,
                              ),
                              myLocationButtonEnabled: false,
                              zoomControlsEnabled: false,
                              markers: {
                                Marker(
                                  markerId: const MarkerId('bus'),
                                  position: LatLng(latitude, longitude),
                                  infoWindow: const InfoWindow(title: 'Bus'),
                                ),
                                if (nextStopLat != null && nextStopLng != null)
                                  Marker(
                                    markerId:
                                        const MarkerId('school_next_stop'),
                                    position: LatLng(nextStopLat, nextStopLng),
                                    infoWindow:
                                        const InfoWindow(title: 'Next Stop'),
                                  ),
                                if (studentStopLat != null &&
                                    studentStopLng != null)
                                  Marker(
                                    markerId: const MarkerId('home_stop'),
                                    position:
                                        LatLng(studentStopLat, studentStopLng),
                                    infoWindow:
                                        const InfoWindow(title: 'Home Stop'),
                                  ),
                              },
                            ),
                    ),
                  )
                else
                  const _InfoCard(
                    title: 'Map preview',
                    body: 'Bus location is not available yet.',
                    icon: Icons.map_outlined,
                  ),
              ],
            );
          },
        );
      },
    );
  }
}

class _AttendanceTab extends StatelessWidget {
  const _AttendanceTab({required this.api});

  final ParentApi api;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: api.getCurrentTrip(),
      builder: (context, tripSnapshot) {
        if (tripSnapshot.connectionState != ConnectionState.done) {
          return const _LoadingPanel(title: 'Loading attendance history');
        }

        if (tripSnapshot.hasError) {
          return _ErrorPanel(error: tripSnapshot.error.toString());
        }

        final students =
            (tripSnapshot.data?['students'] as List<dynamic>? ?? const []);
        if (students.isEmpty) {
          return const _EmptyPanel(
              message: 'No linked student found for attendance history.');
        }

        final firstStudent = students.first as Map<String, dynamic>;
        final studentId = (firstStudent['id'] ?? '').toString();
        final studentName = (firstStudent['fullName'] ?? 'Student').toString();

        return FutureBuilder<List<dynamic>>(
          future: api.getAttendanceHistory(studentId),
          builder: (context, historySnapshot) {
            if (historySnapshot.connectionState != ConnectionState.done) {
              return const _LoadingPanel(title: 'Loading student events');
            }

            if (historySnapshot.hasError) {
              return _ErrorPanel(error: historySnapshot.error.toString());
            }

            final history = historySnapshot.data ?? const [];
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              children: [
                _InfoCard(
                  title: 'Attendance: $studentName',
                  body: 'Recent boarding and drop events.',
                  icon: Icons.fact_check_outlined,
                ),
                const SizedBox(height: 12),
                ...history.take(8).map((item) {
                  final row = item as Map<String, dynamic>;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      child: ListTile(
                        title: Text('${row['event_type'] ?? '-'}'),
                        subtitle: Text('${row['recorded_at'] ?? '-'}'),
                        trailing: Text('${row['trip_id'] ?? ''}'),
                      ),
                    ),
                  );
                }),
                if (history.isEmpty)
                  const _EmptyInline(message: 'No attendance history yet.'),
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

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({
    required this.api,
    required this.fullName,
  });

  final ParentApi api;
  final String fullName;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: api.getProfile(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LoadingPanel(title: 'Loading profile');
        }

        if (snapshot.hasError) {
          return _ErrorPanel(error: snapshot.error.toString());
        }

        final user = snapshot.data ?? const <String, dynamic>{};
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          children: [
            _InfoCard(
              title: 'Profile',
              body: 'Name: ${user['fullName'] ?? fullName}',
              icon: Icons.person_outline,
            ),
            const SizedBox(height: 12),
            _InfoCard(
              title: 'Role',
              body: '${user['role'] ?? 'parent'}',
              icon: Icons.badge_outlined,
            ),
            const SizedBox(height: 12),
            _InfoCard(
              title: 'School',
              body: '${user['schoolId'] ?? '-'}',
              icon: Icons.school_outlined,
            ),
          ],
        );
      },
    );
  }
}

String _formatDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final year = date.year.toString();
  return '$day/$month/$year';
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          colors: [
            colorScheme.primaryContainer,
            colorScheme.secondaryContainer,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: colorScheme.surface.withValues(alpha: 0.7),
              ),
              child: Icon(icon, color: colorScheme.onSurface),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.85),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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
                  Text(title,
                      style:
                          theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
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

class _EndpointList extends StatelessWidget {
  const _EndpointList({
    required this.endpoints,
  });

  final List<AppApiEndpoint> endpoints;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Allowed API access',
              style: theme.textTheme.titleLarge?.copyWith(fontSize: 18),
            ),
            const SizedBox(height: 8),
            ...endpoints.map(
              (endpoint) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(endpoint.label, style: theme.textTheme.bodyMedium),
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
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(title, style: theme.textTheme.bodyLarge),
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
            Text(
              'Something went wrong',
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
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
