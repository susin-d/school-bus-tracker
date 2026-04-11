import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/colors.dart';

class StopCard extends StatelessWidget {
  const StopCard({
    super.key,
    required this.stop,
    required this.onArrived,
    required this.onBoarded,
    required this.onNoShow,
    this.busy = false,
  });

  final Map<String, dynamic> stop;
  final VoidCallback onArrived;
  final VoidCallback onBoarded;
  final VoidCallback onNoShow;
  final bool busy;

  String get _studentName =>
      (stop['studentName'] ?? stop['addressText'] ?? 'Stop').toString();

  String get _status => (stop['stopStatus'] ?? 'scheduled').toString();

  String get _eta =>
      (stop['currentEta'] ?? stop['plannedEta'] ?? '--').toString();

  int get _sequence => (stop['sequence'] as int?) ?? 0;

  bool get _isCompleted =>
      _status == 'boarded' || _status == 'no_show' || _status == 'dropped';

  bool get _isArrived => _status == 'arrived';

  Color _statusColor(BuildContext context) {
    switch (_status) {
      case 'arrived':
        return Colors.blue;
      case 'boarded':
        return Colors.green;
      case 'no_show':
        return Colors.red;
      case 'dropped':
        return Colors.teal;
      default:
        return Theme.of(context).brightness == Brightness.dark
            ? AppDarkColors.textSecondary
            : AppLightColors.textSecondary;
    }
  }

  String _statusLabel() {
    switch (_status) {
      case 'arrived':
        return 'Arrived';
      case 'boarded':
        return 'Boarded';
      case 'no_show':
        return 'No Show';
      case 'dropped':
        return 'Dropped';
      case 'scheduled':
        return 'Scheduled';
      default:
        return _status;
    }
  }

  IconData _statusIcon() {
    switch (_status) {
      case 'arrived':
        return Icons.place_rounded;
      case 'boarded':
        return Icons.check_circle_rounded;
      case 'no_show':
        return Icons.cancel_rounded;
      case 'dropped':
        return Icons.where_to_vote_rounded;
      default:
        return Icons.schedule_rounded;
    }
  }

  Future<void> _openNavigation(BuildContext context) async {
    final lat = (stop['latitude'] as num?)?.toDouble();
    final lng = (stop['longitude'] as num?)?.toDouble();
    if (lat == null || lng == null) return;

    final googleNav = Uri.parse('google.navigation:q=$lat,$lng');
    final googleWeb = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
    final appleMaps = Uri.parse('http://maps.apple.com/?daddr=$lat,$lng');

    final candidates = Platform.isIOS
        ? [googleWeb, appleMaps]
        : [googleNav, googleWeb, appleMaps];

    for (final uri in candidates) {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final statusColor = _statusColor(context);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isCompleted
              ? statusColor.withAlpha(80)
              : (isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder),
        ),
        boxShadow: [
          if (!_isCompleted)
            BoxShadow(
              color: Colors.black.withAlpha(isDark ? 40 : 12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: sequence + name + status chip
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isCompleted
                        ? statusColor.withAlpha(30)
                        : AppColors.orange.withAlpha(20),
                  ),
                  child: Center(
                    child: Text(
                      '$_sequence',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: _isCompleted ? statusColor : AppColors.orange,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _studentName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                          decoration: _isCompleted ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ETA: $_eta',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusChip(
                  label: _statusLabel(),
                  icon: _statusIcon(),
                  color: statusColor,
                ),
              ],
            ),

            // Action buttons (shown only for non-completed stops)
            if (!_isCompleted) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  // Navigate button
                  if (stop['latitude'] != null && stop['longitude'] != null)
                    _StopAction(
                      icon: Icons.navigation_rounded,
                      label: 'Navigate',
                      color: Colors.blue,
                      onTap: () => _openNavigation(context),
                    ),
                  if (stop['latitude'] != null && stop['longitude'] != null)
                    const SizedBox(width: 8),

                  if (!_isArrived)
                    _StopAction(
                      icon: Icons.place_rounded,
                      label: 'Arrived',
                      color: Colors.blue,
                      onTap: busy ? null : onArrived,
                    ),

                  if (_isArrived) ...[
                    _StopAction(
                      icon: Icons.check_circle_rounded,
                      label: 'Boarded',
                      color: Colors.green,
                      onTap: busy ? null : onBoarded,
                    ),
                    const SizedBox(width: 8),
                    _StopAction(
                      icon: Icons.cancel_rounded,
                      label: 'No Show',
                      color: Colors.red,
                      onTap: busy ? null : onNoShow,
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _StopAction extends StatelessWidget {
  const _StopAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: SizedBox(
        height: 40,
        child: OutlinedButton.icon(
          onPressed: onTap,
          icon: Icon(icon, size: 16, color: color),
          label: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: color.withAlpha(80)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 8),
          ),
        ),
      ),
    );
  }
}
