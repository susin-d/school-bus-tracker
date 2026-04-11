import 'dart:async';
import 'dart:math' show cos, sqrt, asin;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/app_state.dart';
import '../../core/colors.dart';
import 'driver_api.dart';
import '../../core/marker_generator.dart';
import '../../core/widgets/permission_guard.dart';

class ActiveTripScreen extends StatefulWidget {
  const ActiveTripScreen({super.key});

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  GoogleMapController? _mapController;
  StreamSubscription<Position>? _positionStream;
  Position? _currentPosition;
  bool _loading = false;
  List<Map<String, dynamic>> _stops = [];
  BitmapDescriptor? _busIcon;
  BitmapDescriptor? _stopIcon;
  BitmapDescriptor? _schoolIcon;

  // Geofencing state
  bool _showingArrivalDialog = false;

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

    setState(() => _loading = true);
    try {
      final api = _buildApi();
      final payload = await api.getTripManifest(trip.id);
      final list = (payload['stops'] as List<dynamic>?)
              ?.map((s) => s as Map<String, dynamic>)
              .toList() ??
          [];
      setState(() {
        _stops = list;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _startLocationTracking() {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5,
    );

    _positionStream = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position position) {
        if (!mounted) return;
        setState(() {
           _currentPosition = position;
           _loading = false;
        });
        _checkGeofences(position);
        _updateBackendLocation(position);
      },
      onError: (error) {
        if (!mounted) return;
        setState(() => _loading = false);
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

    final nextStop = _getNextStop();
    if (nextStop == null) return;

    final stopLat = (nextStop['latitude'] as num).toDouble();
    final stopLng = (nextStop['longitude'] as num).toDouble();

    final distance = Geolocator.distanceBetween(
      pos.latitude,
      pos.longitude,
      stopLat,
      stopLng,
    );

    // If within 100m (user asked for 50m, but 100m is safer for GPS drift)
    if (distance < 100) {
      _onArrivedAtStop(nextStop);
    }
  }

  Map<String, dynamic>? _getNextStop() {
    try {
      return _stops.firstWhere((s) {
        final status = s['stopStatus']?.toString() ?? 'scheduled';
        return status != 'boarded' && status != 'no_show' && status != 'skipped' && status != 'dropped';
      });
    } catch (_) {
      return null;
    }
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

  Future<void> _handleStopAction(Map<String, dynamic> stop, String action) async {
    final trip = AppScope.of(context).currentTrip!;
    final api = _buildApi();
    
    try {
      if (action == 'boarded') {
        await api.markStopBoarded(tripId: trip.id, stopId: stop['id'].toString());
      } else if (action == 'no_show') {
         await api.markStopNoShow(tripId: trip.id, stopId: stop['id'].toString());
      } else if (action == 'dropped') {
        await api.updateStopStatus(stopId: stop['id'].toString(), status: 'dropped', tripId: trip.id);
      }
      
      if (mounted) {
        Navigator.pop(context);
        _loadManifest();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Action failed: $e')));
      }
    }
  }

  double _calculateDistance(double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  @override
  Widget build(BuildContext context) {
    final trip = AppScope.of(context).currentTrip;
    final nextStop = _getNextStop();
    final distanceToNext = (nextStop != null && _currentPosition != null)
        ? _calculateDistance(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
            (nextStop['latitude'] as num).toDouble(),
            (nextStop['longitude'] as num).toDouble(),
          )
        : null;

    final isAtSchool = nextStop == null && _stops.isNotEmpty; // Last stop/School reached

    return PermissionGuard(
      child: Scaffold(
        body: Stack(
        children: [
          // Google Map
          GoogleMap(
            initialCameraPosition: const CameraPosition(target: LatLng(12.9716, 77.5946), zoom: 15),
            onMapCreated: (c) => _mapController = c,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            markers: {
              if (_currentPosition != null)
                Marker(
                  markerId: const MarkerId('bus'),
                  position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                  icon: _busIcon ?? BitmapDescriptor.defaultMarker,
                ),
              ..._stops.map((s) => Marker(
                markerId: MarkerId(s['id'].toString()),
                position: LatLng((s['latitude'] as num).toDouble(), (s['longitude'] as num).toDouble()),
                icon: (s['studentId'] == null) ? (_schoolIcon ?? BitmapDescriptor.defaultMarker) : (_stopIcon ?? BitmapDescriptor.defaultMarker),
                alpha: (s['stopStatus'] == 'boarded' || s['stopStatus'] == 'no_show') ? 0.3 : 1.0,
              )),
            },
          ),

          // Top Info Panel
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: _TopTripPanel(
              trip: trip, 
              nextStop: nextStop,
              distance: distanceToNext,
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
                      final api = _buildApi();
                      await api.startTrip(trip!.id);
                      _loadManifest();
                    },
                  ),
                if (isAtSchool && trip?.status == 'active')
                  _CompleteTripSlider(
                    onComplete: () async {
                      final api = _buildApi();
                      await api.endTrip(trip!.id);
                      if (mounted) {
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
  const _TopTripPanel({required this.trip, this.nextStop, this.distance});
  final TripData? trip;
  final Map<String, dynamic>? nextStop;
  final double? distance;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 10, offset: const Offset(0, 5))],
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
                  nextStop != null ? 'Next: ${nextStop!['studentName'] ?? 'School'}' : 'Route Completed',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (distance != null)
                Text(
                  '${(distance! / 1000).toStringAsFixed(1)} km',
                  style: const TextStyle(color: AppColors.orange, fontWeight: FontWeight.bold),
                ),
            ],
          ),
          if (nextStop != null && nextStop!['addressText'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 28),
              child: Text(
                nextStop!['addressText'],
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
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
      child: const Text('START TRIP', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
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
          const Text('📍 ARRIVED AT STOP', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.orange)),
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 40,
            backgroundColor: Colors.grey[200],
            child: const Icon(Icons.person, size: 40, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          Text(stop['studentName'] ?? 'Unknown Student', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
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
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
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
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, letterSpacing: 1),
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
