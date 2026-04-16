import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../../core/colors.dart';
import '../../core/traffic_service.dart';
import 'driver_api.dart';
import '../../core/marker_generator.dart';
import '../../core/widgets/permission_guard.dart';

class ActiveTripScreen extends StatefulWidget {
  const ActiveTripScreen({super.key});

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  final TrafficService _trafficService = TrafficService();
  StreamSubscription<Position>? _positionStream;
  Position? _currentPosition;
  GoogleMapController? _mapController;
  List<Map<String, dynamic>> _stops = [];
  BitmapDescriptor? _busIcon;
  BitmapDescriptor? _stopIcon;
  BitmapDescriptor? _schoolIcon;
  Set<Polyline> _polylines = {};

  // Optimization state
  Position? _lastMapUpdatePosition;
  double _lastMapUpdateHeading = 0.0;
  bool _showingArrivalDialog = false;
  TrafficEstimate? _trafficEstimate;
  bool _trafficLoading = false;
  DateTime? _lastTrafficUpdateAt;
  String? _lastTrafficTargetKey;

  double? _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value.trim());
    return null;
  }

  @override
  void initState() {
    super.initState();
    _initIcons();
    _loadManifest();
    _startLocationTracking();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    super.dispose();
  }

  Future<void> _initIcons() async {
    final bus = await MarkerGenerator.createMarkerFromEmoji('🚍');
    final stop = await MarkerGenerator.createMarkerFromEmoji('🚏');
    final school = await MarkerGenerator.createMarkerFromEmoji('🏫');
    if (mounted) {
      setState(() {
        _busIcon = bus;
        _stopIcon = stop;
        _schoolIcon = school;
      });
    }
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

  Future<void> _loadManifest() async {
    final trip = AppScope.of(context).currentTrip;
    if (trip == null) return;

    try {
      final api = _buildApi();
      final payload = await api.getTripManifest(trip.id);
      final list = (payload['stops'] as List<dynamic>?)
              ?.map((s) => s as Map<String, dynamic>)
              .toList() ??
          [];
      setState(() {
        _stops = list;
      });
      _updateRoutePolylines();
      unawaited(_refreshTrafficEstimate(force: true));
    } catch (e) {
      // Manifest loading failed, silenty fail as manifest might not be ready
    }
  }

  void _startLocationTracking() {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5,
    );

    _positionStream =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position position) {
        if (!mounted) return;

        bool shouldUpdateMap = false;
        if (_lastMapUpdatePosition == null) {
          shouldUpdateMap = true;
        } else {
          final distance = Geolocator.distanceBetween(
            _lastMapUpdatePosition!.latitude,
            _lastMapUpdatePosition!.longitude,
            position.latitude,
            position.longitude,
          );
          final headingDelta = (position.heading - _lastMapUpdateHeading).abs();
          // Threshold: 10 meters OR 15 degrees change
          if (distance > 10 || headingDelta > 15) {
            shouldUpdateMap = true;
          }
        }

        setState(() {
          _currentPosition = position;
          if (shouldUpdateMap) {
            _lastMapUpdatePosition = position;
            _lastMapUpdateHeading = position.heading;
            _polylines = _calculatePolylines(
              LatLng(position.latitude, position.longitude),
              targetStop: _resolveTargetStop(position),
            );

            // Auto-follow logic
            _mapController?.animateCamera(
              CameraUpdate.newCameraPosition(
                CameraPosition(
                  target: LatLng(position.latitude, position.longitude),
                  zoom: 16,
                  bearing: position.heading,
                  tilt: 45,
                ),
              ),
            );
          }
        });

        _checkGeofences(position);
        _updateBackendLocation(position);
        unawaited(_refreshTrafficEstimate());
      },
      onError: (error) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location error: $error')),
        );
      },
    );
  }

  Future<void> _updateBackendLocation(Position pos) async {
    final trip = AppScope.of(context).currentTrip;
    if (trip == null || trip.status != 'active') return;

    try {
      final api = _buildApi();
      await api.updateTripLocation(
        tripId: trip.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speedKph: pos.speed * 3.6,
      );
    } catch (_) {}
  }

  void _checkGeofences(Position pos) {
    if (_showingArrivalDialog) return;
    final trip = AppScope.of(context).currentTrip;
    if (trip?.status != 'active') return;

    final nextStop = _getNearestPendingStudentStop(pos);
    if (nextStop == null) return;

    final stopLng = _asDouble(nextStop['longitude'] ?? nextStop['lng']);
    final stopLatitude = _asDouble(nextStop['latitude'] ?? nextStop['lat']);
    if (stopLatitude == null || stopLng == null) return;

    final distance = Geolocator.distanceBetween(
      pos.latitude,
      pos.longitude,
      stopLatitude,
      stopLng,
    );

    // If within 100m (user asked for 50m, but 100m is safer for GPS drift)
    if (distance < 100) {
      _onArrivedAtStop(nextStop);
    }
  }

  bool _isStopCompleted(Map<String, dynamic> stop) {
    final status = stop['stopStatus']?.toString() ?? 'scheduled';
    return status == 'boarded' ||
        status == 'no_show' ||
        status == 'skipped' ||
        status == 'dropped';
  }

  Map<String, dynamic>? _getNextStop() {
    try {
      return _stops.firstWhere((s) {
        if (s['studentId'] == null) return false;
        return !_isStopCompleted(s);
      });
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic>? _getSchoolStop() {
    try {
      return _stops.firstWhere((s) => s['studentId'] == null);
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic>? _getNearestPendingStudentStop(Position position) {
    double? nearestDistance;
    Map<String, dynamic>? nearestStop;

    for (final stop in _stops) {
      if (stop['studentId'] == null || _isStopCompleted(stop)) continue;
      final point = _parseLatLng(stop);
      if (point == null) continue;
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        point.latitude,
        point.longitude,
      );

      if (nearestDistance == null || distance < nearestDistance) {
        nearestDistance = distance;
        nearestStop = stop;
      }
    }

    return nearestStop;
  }

  Map<String, dynamic>? _resolveTargetStop(Position? position) {
    if (position != null) {
      final nearestStudent = _getNearestPendingStudentStop(position);
      if (nearestStudent != null) return nearestStudent;
    }

    final fallbackStudent = _getNextStop();
    if (fallbackStudent != null) return fallbackStudent;

    return _getSchoolStop();
  }

  LatLng? _resolveRouteOrigin() {
    if (_currentPosition != null) {
      return LatLng(_currentPosition!.latitude, _currentPosition!.longitude);
    }

    final trip = AppScope.of(context).currentTrip;
    final raw = trip?.raw ?? const <String, dynamic>{};
    final latitude = _asDouble(
        raw['lastLocationLat'] ?? raw['last_location_lat'] ?? raw['latitude']);
    final longitude = _asDouble(
        raw['lastLocationLng'] ?? raw['last_location_lng'] ?? raw['longitude']);
    if (latitude != null && longitude != null) {
      return LatLng(latitude, longitude);
    }

    for (final stop in _stops) {
      final point = _parseLatLng(stop);
      if (point != null) {
        return point;
      }
    }

    return null;
  }

  List<LatLng> _buildRoutePoints(
    LatLng origin, {
    Map<String, dynamic>? targetStop,
  }) {
    final List<LatLng> points = [];

    // Start from the current or last known bus position when available.
    points.add(origin);

    if (targetStop != null) {
      final target = _parseLatLng(targetStop);
      if (target != null) {
        points.add(target);
      }
    }

    return points;
  }

  Set<Polyline> _calculatePolylines(
    LatLng origin, {
    Map<String, dynamic>? targetStop,
  }) {
    final points = _buildRoutePoints(origin, targetStop: targetStop);

    return {
      if (points.length > 1)
        Polyline(
          polylineId: const PolylineId('route_path'),
          points: points,
          color: Colors.indigoAccent,
          width: 6,
          jointType: JointType.round,
          endCap: Cap.roundCap,
          startCap: Cap.roundCap,
        ),
    };
  }

  Future<void> _focusRoute(List<LatLng> points) async {
    if (_mapController == null || points.isEmpty || _currentPosition != null) {
      return;
    }

    if (points.length == 1) {
      await _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(points.first, 15),
      );
      return;
    }

    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (final point in points.skip(1)) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
    }

    if (minLat == maxLat && minLng == maxLng) {
      await _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(points.first, 15),
      );
      return;
    }

    await _mapController!.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(minLat, minLng),
          northeast: LatLng(maxLat, maxLng),
        ),
        64,
      ),
    );
  }

  void _updateRoutePolylines() {
    final origin = _resolveRouteOrigin();
    if (origin == null) return;
    final targetStop = _resolveTargetStop(_currentPosition);
    final routePoints = _buildRoutePoints(origin, targetStop: targetStop);
    final newPolylines = _calculatePolylines(origin, targetStop: targetStop);
    if (mounted) {
      setState(() {
        _polylines = newPolylines;
      });
    }
    unawaited(_focusRoute(routePoints));
  }

  String _targetKey(Map<String, dynamic>? stop) {
    if (stop == null) return 'none';
    final id = stop['id']?.toString();
    return id == null || id.isEmpty ? 'school' : id;
  }

  Future<void> _refreshTrafficEstimate({bool force = false}) async {
    final currentPosition = _currentPosition;
    final targetStop = _resolveTargetStop(currentPosition);

    if (currentPosition == null || targetStop == null) {
      if (mounted) {
        setState(() {
          _trafficEstimate = null;
          _trafficLoading = false;
        });
      }
      return;
    }

    final target = _parseLatLng(targetStop);
    if (target == null) return;

    final now = DateTime.now();
    final targetKey = _targetKey(targetStop);
    if (!force &&
        _lastTrafficUpdateAt != null &&
        now.difference(_lastTrafficUpdateAt!) < const Duration(seconds: 25) &&
        targetKey == _lastTrafficTargetKey) {
      return;
    }

    if (mounted) {
      setState(() => _trafficLoading = true);
    }

    final estimate = await _trafficService.estimateTravel(
      origin: LatLng(currentPosition.latitude, currentPosition.longitude),
      destination: target,
    );

    if (!mounted) return;
    setState(() {
      _trafficEstimate = estimate;
      _trafficLoading = false;
      _lastTrafficUpdateAt = now;
      _lastTrafficTargetKey = targetKey;
    });
  }

  Future<void> _openTurnByTurnNavigation(Map<String, dynamic> stop) async {
    final target = _parseLatLng(stop);
    if (target == null) return;

    final url = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}&travelmode=driving',
    );

    if (!await launchUrl(url, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open navigation app.')),
      );
    }
  }

  LatLng? _parseLatLng(Map<String, dynamic> stop) {
    final lat = _asDouble(stop['latitude'] ?? stop['lat']);
    final lng = _asDouble(stop['longitude'] ?? stop['lng']);
    if (lat == null || lng == null) return null;
    return LatLng(lat, lng);
  }

  void _onArrivedAtStop(Map<String, dynamic> stop) {
    if (_showingArrivalDialog) return;
    _showingArrivalDialog = true;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => _ArrivalDialog(
        stop: stop,
        onAction: (action) => _handleStopAction(stop, action),
      ),
    ).then((_) => _showingArrivalDialog = false);
  }

  Future<void> _handleStopAction(
      Map<String, dynamic> stop, String action) async {
    final trip = AppScope.of(context).currentTrip!;
    final api = _buildApi();

    try {
      if (action == 'boarded') {
        await api.markStopBoarded(
            tripId: trip.id, stopId: stop['id'].toString());
      } else if (action == 'no_show') {
        await api.markStopNoShow(
            tripId: trip.id, stopId: stop['id'].toString());
      } else if (action == 'dropped') {
        await api.updateStopStatus(
            stopId: stop['id'].toString(), status: 'dropped', tripId: trip.id);
      }

      if (mounted) {
        Navigator.pop(context);
        _loadManifest();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Action failed: $e')));
      }
    }
  }

  double _calculateDistance(
      double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  @override
  Widget build(BuildContext context) {
    final trip = AppScope.of(context).currentTrip;
    final nearestStudent = _currentPosition != null
        ? _getNearestPendingStudentStop(_currentPosition!)
        : _getNextStop();
    final schoolStop = _getSchoolStop();
    final targetStop = nearestStudent ?? schoolStop;
    final targetPos = targetStop != null ? _parseLatLng(targetStop) : null;
    final fallbackDistance = (targetPos != null && _currentPosition != null)
        ? _calculateDistance(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
            targetPos.latitude,
            targetPos.longitude,
          )
        : null;
    final distanceToTarget = _trafficEstimate?.distanceMeters.toDouble() ?? fallbackDistance;
    final isReturningToSchool = nearestStudent == null && schoolStop != null;
    final hasReachedSchool = isReturningToSchool &&
        distanceToTarget != null &&
        distanceToTarget <= 120;
    final targetMarkerId = targetStop?['id']?.toString();

    return PermissionGuard(
        child: Scaffold(
      body: Stack(
        children: [
          // Google Map
          GoogleMap(
            initialCameraPosition: const CameraPosition(
                target: LatLng(13.0827, 80.2707), zoom: 15),
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            onMapCreated: (controller) => _mapController = controller,
            trafficEnabled: true,
            markers: {
              if (_currentPosition != null)
                Marker(
                  markerId: const MarkerId('bus'),
                  position: LatLng(
                      _currentPosition!.latitude, _currentPosition!.longitude),
                  icon: _busIcon ?? BitmapDescriptor.defaultMarker,
                ),
              ..._stops.map((s) {
                final pos = _parseLatLng(s);
                if (pos == null) {
                  return const Marker(markerId: MarkerId('null'));
                }
                return Marker(
                  markerId: MarkerId(s['id'].toString()),
                  position: pos,
                  icon: (s['studentId'] == null)
                      ? (_schoolIcon ?? BitmapDescriptor.defaultMarker)
                      : (_stopIcon ?? BitmapDescriptor.defaultMarker),
                  zIndexInt: targetMarkerId != null && s['id']?.toString() == targetMarkerId ? 2 : 1,
                  alpha: (s['stopStatus'] == 'boarded' ||
                          s['stopStatus'] == 'no_show')
                      ? 0.3
                      : 1.0,
                );
              }).where((m) => m.markerId.value != 'null'),
            },
            polylines: _polylines,
          ),

          // Top Info Panel
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: _TopTripPanel(
              trip: trip,
              targetStop: targetStop,
              distance: distanceToTarget,
              trafficEstimate: _trafficEstimate,
              trafficLoading: _trafficLoading,
              returningToSchool: isReturningToSchool,
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (trip?.status == 'ready' || trip?.status == 'scheduled')
                  _StartTripOverlay(
                    onStart: () async {
                      try {
                        final api = _buildApi();
                        await api.startTrip(trip!.id);
                        if (context.mounted) {
                          AppScope.of(context).updateTripStatus('active');
                          await _loadManifest();
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to start trip: $e')),
                          );
                        }
                      }
                    },
                  ),
                if (isReturningToSchool && trip?.status == 'active' && !hasReachedSchool)
                  _ReturnToSchoolAction(
                    schoolStop: schoolStop,
                    distanceMeters: distanceToTarget,
                    etaSeconds: _trafficEstimate?.effectiveDurationSeconds,
                    onNavigate: () => _openTurnByTurnNavigation(schoolStop),
                  ),
                if (hasReachedSchool && trip?.status == 'active')
                  _CompleteTripSlider(
                    onComplete: () async {
                      final api = _buildApi();
                      await api.endTrip(trip!.id);
                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                    },
                  ),
              ],
            ),
          ),

          // Back Button
          Positioned(
            top: 60,
            left: 20,
            child: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ],
      ),
    ));
  }
}

class _TopTripPanel extends StatelessWidget {
  const _TopTripPanel({
    required this.trip,
    this.targetStop,
    this.distance,
    this.trafficEstimate,
    required this.trafficLoading,
    required this.returningToSchool,
  });
  final TripData? trip;
  final Map<String, dynamic>? targetStop;
  final double? distance;
  final TrafficEstimate? trafficEstimate;
  final bool trafficLoading;
  final bool returningToSchool;

  String _formatDuration(int seconds) {
    final minutes = (seconds / 60).round();
    if (minutes < 60) {
      return '$minutes min';
    }
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    return '${hours}h ${remainingMinutes}m';
  }

  Color _trafficColor(TrafficLevel level) {
    switch (level) {
      case TrafficLevel.high:
        return Colors.red;
      case TrafficLevel.medium:
        return Colors.orange;
      case TrafficLevel.low:
        return Colors.green;
      case TrafficLevel.unknown:
        return Colors.blueGrey;
    }
  }

  String _trafficLabel(TrafficLevel level) {
    switch (level) {
      case TrafficLevel.high:
        return 'Heavy Traffic';
      case TrafficLevel.medium:
        return 'Moderate Traffic';
      case TrafficLevel.low:
        return 'Light Traffic';
      case TrafficLevel.unknown:
        return 'Traffic Unavailable';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withAlpha(20),
              blurRadius: 10,
              offset: const Offset(0, 5))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.location_on, color: Colors.red, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  targetStop != null
                    ? returningToSchool
                      ? 'Return: ${targetStop!['name'] ?? 'School'}'
                      : 'Nearest Student: ${targetStop!['studentName'] ?? 'Stop'}'
                      : 'Route Completed',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (distance != null)
                Text(
                  '${(distance! / 1000).toStringAsFixed(1)} km',
                  style: const TextStyle(
                      color: AppColors.orange, fontWeight: FontWeight.bold),
                ),
            ],
          ),
          if (targetStop != null && targetStop!['addressText'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 28),
              child: Text(
                targetStop!['addressText'],
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (trafficLoading)
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else if (trafficEstimate != null)
                Icon(
                  Icons.traffic_rounded,
                  size: 16,
                  color: _trafficColor(trafficEstimate!.trafficLevel),
                ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  trafficEstimate == null
                      ? 'ETA unavailable'
                      : '${_formatDuration(trafficEstimate!.effectiveDurationSeconds)} • ${_trafficLabel(trafficEstimate!.trafficLevel)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: trafficEstimate == null
                        ? Colors.grey
                        : _trafficColor(trafficEstimate!.trafficLevel),
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReturnToSchoolAction extends StatelessWidget {
  const _ReturnToSchoolAction({
    required this.schoolStop,
    required this.distanceMeters,
    required this.etaSeconds,
    required this.onNavigate,
  });

  final Map<String, dynamic>? schoolStop;
  final double? distanceMeters;
  final int? etaSeconds;
  final VoidCallback? onNavigate;

  String _formatEta(int? seconds) {
    if (seconds == null) return '--';
    final minutes = (seconds / 60).round();
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    final rem = minutes % 60;
    return '${hours}h ${rem}m';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(26),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.school_rounded, color: AppColors.orange),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  schoolStop?['name']?.toString() ?? 'Return to School',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${distanceMeters == null ? '--' : (distanceMeters! / 1000).toStringAsFixed(1)} km • ETA ${_formatEta(etaSeconds)}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          FilledButton.tonal(
            onPressed: onNavigate,
            child: const Text('Navigate'),
          ),
        ],
      ),
    );
  }
}

class _StartTripOverlay extends StatelessWidget {
  const _StartTripOverlay({required this.onStart});
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 60),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        elevation: 10,
      ),
      onPressed: onStart,
      child: const Text('START TRIP',
          style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
    );
  }
}

class _ArrivalDialog extends StatelessWidget {
  const _ArrivalDialog({required this.stop, required this.onAction});
  final Map<String, dynamic> stop;
  final Function(String) onAction;

  @override
  Widget build(BuildContext context) {
    final isPickup = stop['studentId'] != null; // Simplification

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('📍 ARRIVED AT STOP',
              style: TextStyle(
                  fontWeight: FontWeight.bold, color: AppColors.orange)),
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 40,
            backgroundColor: Colors.grey[200],
            child: const Icon(Icons.person, size: 40, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          Text(stop['studentName'] ?? 'Unknown Student',
              style:
                  const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => onAction('no_show'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('NO SHOW'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => onAction(isPickup ? 'boarded' : 'dropped'),
                  style:
                      ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: Text(isPickup ? 'CHECK IN' : 'CHECK OUT'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CompleteTripSlider extends StatefulWidget {
  const _CompleteTripSlider({required this.onComplete});
  final VoidCallback onComplete;

  @override
  State<_CompleteTripSlider> createState() => _CompleteTripSliderState();
}

class _CompleteTripSliderState extends State<_CompleteTripSlider> {
  double _value = 0.0;
  bool _completed = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 70,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.red.withAlpha(20),
        borderRadius: BorderRadius.circular(35),
        border: Border.all(color: Colors.red.withAlpha(50)),
      ),
      child: Stack(
        children: [
          const Center(
            child: Text(
              'SLIDE TO COMPLETE TRIP',
              style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1),
            ),
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 70,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 30),
              overlayShape: SliderComponentShape.noOverlay,
              thumbColor: Colors.red,
              activeTrackColor: Colors.transparent,
              inactiveTrackColor: Colors.transparent,
            ),
            child: Slider(
              value: _value,
              onChanged: (val) {
                if (_completed) return;
                setState(() => _value = val);
                if (val > 0.95) {
                  setState(() => _completed = true);
                  widget.onComplete();
                }
              },
              onChangeEnd: (val) {
                if (val < 0.95) setState(() => _value = 0);
              },
            ),
          ),
        ],
      ),
    );
  }
}
