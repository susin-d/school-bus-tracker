import 'package:flutter/material.dart';

import '../../core/api_access.dart';
import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import 'driver_api.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  final _tripIdController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _delayMessageController = TextEditingController(text: 'Traffic delay on route');
  final _latitudeController = TextEditingController(text: '12.9716');
  final _longitudeController = TextEditingController(text: '77.5946');
  final _statusController = TextEditingController(text: 'active');

  String _feedback = '';
  bool _busy = false;

  @override
  void dispose() {
    _tripIdController.dispose();
    _studentIdController.dispose();
    _delayMessageController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _statusController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appState = AppScope.of(context);
    final user = appState.currentUser!;
    final api = DriverApi(
      ApiClient(
        userId: user.id,
        accessToken: user.accessToken,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Home'),
        actions: [
          IconButton(
            onPressed: _busy ? null : () => appState.signOut(),
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          Text(
            'Welcome, ${user.fullName}',
            style: theme.textTheme.headlineLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Live driver operations wired to backend trip, attendance, and alert APIs.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 20),
          _InputCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _tripIdController,
                  decoration: const InputDecoration(
                    labelText: 'Trip ID',
                    hintText: 'trip-1',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _studentIdController,
                  decoration: const InputDecoration(
                    labelText: 'Student ID',
                    hintText: 'student-1',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _ActionRow(
            children: [
              _ActionButton(
                busy: _busy,
                label: 'Current Trip',
                onTap: () => _runAction(() async {
                  final payload = await api.getCurrentTrip();
                  final trip = payload['trip'] as Map<String, dynamic>?;
                  return trip == null
                      ? 'No active trip found.'
                      : 'Current trip: ${trip['id']} (${trip['status']})';
                }),
              ),
              _ActionButton(
                busy: _busy,
                label: 'Start Trip',
                onTap: () => _runAction(() async {
                  final tripId = _requireText(_tripIdController, 'Trip ID');
                  final payload = await api.startTrip(tripId);
                  return 'Trip ${payload['tripId']} is ${payload['status']}.';
                }),
              ),
              _ActionButton(
                busy: _busy,
                label: 'End Trip',
                onTap: () => _runAction(() async {
                  final tripId = _requireText(_tripIdController, 'Trip ID');
                  final payload = await api.endTrip(tripId);
                  return 'Trip ${payload['tripId']} is ${payload['status']}.';
                }),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _InputCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _statusController,
                  decoration: const InputDecoration(
                    labelText: 'Trip Status',
                    hintText: 'active | paused | completed',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                _ActionButton(
                  busy: _busy,
                  label: 'Update Status',
                  onTap: () => _runAction(() async {
                    final tripId = _requireText(_tripIdController, 'Trip ID');
                    final status = _requireText(_statusController, 'Trip Status');
                    final payload = await api.updateTripStatus(tripId: tripId, status: status);
                    return 'Trip ${payload['tripId']} status updated to ${payload['status']}.';
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _InputCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _latitudeController,
                  decoration: const InputDecoration(
                    labelText: 'Latitude',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _longitudeController,
                  decoration: const InputDecoration(
                    labelText: 'Longitude',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                _ActionButton(
                  busy: _busy,
                  label: 'Update Location',
                  onTap: () => _runAction(() async {
                    final tripId = _requireText(_tripIdController, 'Trip ID');
                    final latitude = double.tryParse(_latitudeController.text.trim());
                    final longitude = double.tryParse(_longitudeController.text.trim());
                    if (latitude == null || longitude == null) {
                      throw const FormatException('Latitude and longitude must be valid numbers.');
                    }
                    await api.updateTripLocation(
                      tripId: tripId,
                      latitude: latitude,
                      longitude: longitude,
                    );
                    return 'Trip location updated.';
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _ActionRow(
            children: [
              _ActionButton(
                busy: _busy,
                label: 'Board Student',
                onTap: () => _runAction(() async {
                  final tripId = _requireText(_tripIdController, 'Trip ID');
                  final studentId = _requireText(_studentIdController, 'Student ID');
                  await api.boardStudent(tripId: tripId, studentId: studentId);
                  return 'Boarding event recorded.';
                }),
              ),
              _ActionButton(
                busy: _busy,
                label: 'Drop Student',
                onTap: () => _runAction(() async {
                  final tripId = _requireText(_tripIdController, 'Trip ID');
                  final studentId = _requireText(_studentIdController, 'Student ID');
                  await api.dropStudent(tripId: tripId, studentId: studentId);
                  return 'Drop event recorded.';
                }),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _InputCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _delayMessageController,
                  decoration: const InputDecoration(
                    labelText: 'Delay Message',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                _ActionButton(
                  busy: _busy,
                  label: 'Report Delay',
                  onTap: () => _runAction(() async {
                    final tripId = _requireText(_tripIdController, 'Trip ID');
                    final message = _requireText(_delayMessageController, 'Delay message');
                    await api.reportDelay(tripId: tripId, message: message);
                    return 'Delay alert sent.';
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (_feedback.isNotEmpty)
            Text(
              _feedback,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface),
            ),
          const SizedBox(height: 20),
          Text(
            'Allowed API access',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          _EndpointList(
            endpoints: RoleApiAccess.allowedEndpoints(user.role),
          ),
        ],
      ),
    );
  }

  String _requireText(TextEditingController controller, String fieldName) {
    final value = controller.text.trim();
    if (value.isEmpty) {
      throw FormatException('$fieldName is required.');
    }
    return value;
  }

  Future<void> _runAction(Future<String> Function() action) async {
    setState(() {
      _busy = true;
      _feedback = '';
    });
    try {
      final message = await action();
      if (!mounted) return;
      setState(() {
        _feedback = message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _feedback = error is Exception ? error.toString().replaceFirst('Exception: ', '') : 'Action failed.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }
}

class _InputCard extends StatelessWidget {
  const _InputCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: child,
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: children,
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.busy,
    required this.label,
    required this.onTap,
  });

  final bool busy;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilledButton.tonal(
      onPressed: busy ? null : onTap,
      child: Text(label),
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
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This screen only calls driver-safe endpoints.',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 12),
            ...endpoints.map(
              (endpoint) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(endpoint.label, style: theme.textTheme.bodyMedium),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
