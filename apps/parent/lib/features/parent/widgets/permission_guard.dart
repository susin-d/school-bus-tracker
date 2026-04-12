import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/location_service.dart';

class PermissionGuard extends StatefulWidget {
  final Widget child;
  final String title;

  const PermissionGuard({
    super.key,
    required this.child,
    this.title = 'Location Permission Required',
  });

  @override
  State<PermissionGuard> createState() => _PermissionGuardState();
}

class _PermissionGuardState extends State<PermissionGuard> {
  final _service = LocationService();
  bool? _granted;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    final granted = await _service.hasPermission();
    if (mounted) {
      setState(() => _granted = granted);
    }
  }

  Future<void> _requestPermission() async {
    final granted = await _service.requestPermission();
    if (mounted) {
      setState(() => _granted = granted);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_granted == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_granted!) {
      return widget.child;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_off_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Map tracking requires location access',
              style: TextStyle(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'We need your location to show where you are relative to the SURAKSHA bus.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _requestPermission,
              child: const Text('Allow Access'),
            ),
            TextButton(
              onPressed: () => Geolocator.openAppSettings(),
              child: const Text('Open Settings'),
            ),
          ],
        ),
      ),
    );
  }
}
