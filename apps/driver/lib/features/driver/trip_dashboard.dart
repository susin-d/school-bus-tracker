import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../../core/colors.dart';
import '../../core/location_service.dart';
import '../../core/marker_generator.dart';
import 'driver_api.dart';
import 'incident_sheet.dart';
import 'stop_card.dart';

class TripDashboard extends StatefulWidget {
  const TripDashboard({
    super.key,
    required this.trip,
    required this.api,
    required this.onTripEnded,
  });

  final TripData trip;
  final DriverApi api;
  final VoidCallback onTripEnded;

  @override
  State<TripDashboard> createState() => _TripDashboardState();
}

class _TripDashboardState extends State<TripDashboard> {
  final LocationService _locationService = LocationService();
  bool _busy = false;
  double? _currentLat;
  double? _currentLng;
  bool _mapExpanded = false;
  BitmapDescriptor? _busIcon;
  BitmapDescriptor? _stopIcon;

  @override
  void initState() {
    super.initState();
    _loadManifest();
    _initLocationTracking();
    _initIcons();
  }

  Future<void> _initIcons() async {
    final bus = await MarkerGenerator.createMarkerFromEmoji('🚍');
    final stop = await MarkerGenerator.createMarkerFromEmoji('🚏');
    if (mounted) {
      setState(() {
        _busIcon = bus;
        _stopIcon = stop;
      });
    }
  }

  @override
  void dispose() {
    _locationService.dispose();
    super.dispose();
  }

  Future<void> _initLocationTracking() async {
    final granted = await _locationService.requestPermission();
    if (!granted) {
      _showSnack('Location permission required for GPS tracking.');
      return;
    }

    // Get initial position
    final pos = await _locationService.getCurrentPosition();
    if (pos != null && mounted) {
      setState(() {
        _currentLat = pos.latitude;
        _currentLng = pos.longitude;
      });
    }

    // Start automatic tracking if trip is active
    if (widget.trip.status == 'active') {
      _startTracking();
    }
  }

  void _startTracking() {
    _locationService.startTracking(
      onLocation: (lat, lng) async {
        if (!mounted) return;
        setState(() {
          _currentLat = lat;
          _currentLng = lng;
        });
        try {
          await widget.api.updateTripLocation(
            tripId: widget.trip.id,
            latitude: lat,
            longitude: lng,
          );
        } catch (_) {
          // Silent fail for location updates
        }
      },
      onError: (_) {},
    );
  }

  Future<void> _loadManifest() async {
    try {
      final payload = await widget.api.getTripManifest(widget.trip.id);
      if (!mounted) return;
      final stops = (payload['stops'] as List<dynamic>?)
              ?.map((s) => s as Map<String, dynamic>)
              .toList() ??
          const [];
      AppScope.of(context).setManifestStops(stops);
    } catch (e) {
      _showSnack('Failed to load manifest.');
    }
  }

  Future<void> _handleStartTrip() async {
    await _runAction(() async {
      await widget.api.startTrip(widget.trip.id);
      if (!mounted) return;
      AppScope.of(context).updateTripStatus('active');
      _startTracking();
      _showSnack('Trip started! GPS tracking is now active.');
    });
  }

  Future<void> _handleEndTrip() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('End Trip'),
        content: const Text('Are you sure you want to end this trip? This action cannot be undone.'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('End Trip'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await _runAction(() async {
      await widget.api.endTrip(widget.trip.id);
      _locationService.stopTracking();
      if (!mounted) return;
      widget.onTripEnded();
    });
  }

  Future<void> _handleStopArrived(String stopId) async {
    await _runAction(() async {
      await widget.api.markStopArrived(
        tripId: widget.trip.id,
        stopId: stopId,
      );
      if (!mounted) return;
      AppScope.of(context).updateStopStatus(stopId, 'arrived');
      _showSnack('Marked as arrived.');
    });
  }

  Future<void> _handleStopBoarded(String stopId) async {
    await _runAction(() async {
      await widget.api.markStopBoarded(
        tripId: widget.trip.id,
        stopId: stopId,
      );
      if (!mounted) return;
      AppScope.of(context).updateStopStatus(stopId, 'boarded');
      _showSnack('Student boarded.');
    });
  }

  Future<void> _handleStopNoShow(String stopId) async {
    await _runAction(() async {
      await widget.api.markStopNoShow(
        tripId: widget.trip.id,
        stopId: stopId,
      );
      if (!mounted) return;
      AppScope.of(context).updateStopStatus(stopId, 'no_show');
      _showSnack('Marked as no-show.');
    });
  }

  Future<void> _handleReoptimize() async {
    await _runAction(() async {
      await widget.api.reoptimizeTrip(
        tripId: widget.trip.id,
        reason: 'driver_manual',
      );
      await _loadManifest();
      _showSnack('Route re-optimized.');
    });
  }

  void _showIncidentSheet() {
    IncidentSheet.show(
      context,
      onReportDelay: (message) async {
        await widget.api.reportDelay(
          tripId: widget.trip.id,
          message: message,
        );
        _showSnack('Delay reported.');
      },
      onMajorDelay: (message) async {
        await widget.api.reportMajorDelay(
          tripId: widget.trip.id,
          message: message,
        );
        await _loadManifest();
        _showSnack('Major delay reported. Route re-optimized.');
      },
      onBreakdown: () async {
        await widget.api.reportBreakdown(
          tripId: widget.trip.id,
          message: 'Vehicle breakdown reported by driver',
        );
        await _loadManifest();
        _showSnack('Breakdown reported. Route re-optimized.');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final appState = AppScope.of(context);
    final trip = appState.currentTrip ?? widget.trip;
    final stops = appState.manifestStops;
    final isActive = trip.status == 'active';
    final isReady = trip.status == 'ready' || trip.status == 'scheduled';

    return Column(
      children: [
        // Trip status header
        Container(
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isActive
                  ? [AppColors.orange, AppColors.orangeStrong]
                  : [
                      isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
                      isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
                    ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: isActive
                ? null
                : Border.all(
                    color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder,
                  ),
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: AppColors.orange.withAlpha(60),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isActive ? Colors.white.withAlpha(40) : AppColors.orange.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isActive ? Icons.directions_bus_rounded : Icons.schedule_rounded,
                  color: isActive ? Colors.white : AppColors.orange,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      trip.routeName ?? 'Trip ${trip.id}',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: isActive ? Colors.white : (isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isActive
                          ? '${stops.length} stops • GPS tracking active'
                          : '${stops.length} stops • Ready to start',
                      style: TextStyle(
                        fontSize: 12,
                        color: isActive ? Colors.white.withAlpha(200) : (isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              _TripStatusBadge(status: trip.status, isOnGradient: isActive),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Map view
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GestureDetector(
            onTap: () => setState(() => _mapExpanded = !_mapExpanded),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: _mapExpanded ? 280 : 160,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(17),
                child: _currentLat != null && _currentLng != null
                    ? Stack(
                        children: [
                          GoogleMap(
                            key: ValueKey('map-${_currentLat!.toStringAsFixed(4)}-${_currentLng!.toStringAsFixed(4)}'),
                            initialCameraPosition: CameraPosition(
                              target: LatLng(_currentLat!, _currentLng!),
                              zoom: 14,
                            ),
                            markers: {
                              Marker(
                                markerId: const MarkerId('driver'),
                                position: LatLng(_currentLat!, _currentLng!),
                                infoWindow: const InfoWindow(title: 'Your Location'),
                                icon: _busIcon ?? BitmapDescriptor.defaultMarker,
                              ),
                              ...stops
                                  .where((s) => s['latitude'] != null && s['longitude'] != null)
                                  .map((s) => Marker(
                                        markerId: MarkerId('stop-${s['id']}'),
                                        position: LatLng(
                                          (s['latitude'] as num).toDouble(),
                                          (s['longitude'] as num).toDouble(),
                                        ),
                                        infoWindow: InfoWindow(
                                          title: (s['studentName'] ?? 'Stop').toString(),
                                        ),
                                        icon: _stopIcon ??
                                            BitmapDescriptor.defaultMarkerWithHue(
                                              BitmapDescriptor.hueOrange,
                                            ),
                                      )),
                            },
                            myLocationButtonEnabled: false,
                            zoomControlsEnabled: false,
                            mapToolbarEnabled: false,
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(220),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                _mapExpanded ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                                size: 20,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          if (_locationService.isTracking)
                            Positioned(
                              bottom: 8,
                              left: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.withAlpha(220),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.gps_fixed_rounded, size: 12, color: Colors.white),
                                    SizedBox(width: 4),
                                    Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      )
                    : Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.map_outlined,
                              size: 40,
                              color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Acquiring GPS signal...',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Action buttons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              if (isReady) ...[
                Expanded(
                  child: _TripActionButton(
                    icon: Icons.play_arrow_rounded,
                    label: 'Start Trip',
                    color: Colors.green,
                    busy: _busy,
                    onTap: _handleStartTrip,
                  ),
                ),
              ],
              if (isActive) ...[
                Expanded(
                  child: _TripActionButton(
                    icon: Icons.route_rounded,
                    label: 'Re-optimize',
                    color: Colors.blue,
                    busy: _busy,
                    onTap: _handleReoptimize,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _TripActionButton(
                    icon: Icons.warning_amber_rounded,
                    label: 'Incident',
                    color: Colors.orange,
                    busy: _busy,
                    onTap: _showIncidentSheet,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _TripActionButton(
                    icon: Icons.stop_rounded,
                    label: 'End Trip',
                    color: Colors.red,
                    busy: _busy,
                    onTap: _handleEndTrip,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Stops header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Text(
                'Route Stops',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.orange.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${stops.length}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.orange,
                  ),
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: _loadManifest,
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Refresh'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.orange,
                  textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Stop list
        Expanded(
          child: stops.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.route_outlined,
                        size: 48,
                        color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Loading route stops...',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: stops.length,
                  itemBuilder: (context, index) {
                    final stop = stops[index];
                    final stopId = (stop['id'] ?? '').toString();
                    return StopCard(
                      stop: stop,
                      busy: _busy,
                      onArrived: () => _handleStopArrived(stopId),
                      onBoarded: () => _handleStopBoarded(stopId),
                      onNoShow: () => _handleStopNoShow(stopId),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Future<void> _runAction(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

class _TripStatusBadge extends StatelessWidget {
  const _TripStatusBadge({required this.status, this.isOnGradient = false});

  final String status;
  final bool isOnGradient;

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'active':
        color = Colors.green;
        label = 'ACTIVE';
        break;
      case 'completed':
        color = Colors.blue;
        label = 'DONE';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'CANCELLED';
        break;
      default:
        color = Colors.orange;
        label = 'READY';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isOnGradient ? Colors.white.withAlpha(40) : color.withAlpha(20),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isOnGradient ? Colors.white.withAlpha(60) : color.withAlpha(60),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
          color: isOnGradient ? Colors.white : color,
        ),
      ),
    );
  }
}

class _TripActionButton extends StatelessWidget {
  const _TripActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.busy,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        onPressed: busy ? null : onTap,
        icon: Icon(icon, size: 18, color: color),
        label: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: color.withAlpha(80)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 10),
        ),
      ),
    );
  }
}
