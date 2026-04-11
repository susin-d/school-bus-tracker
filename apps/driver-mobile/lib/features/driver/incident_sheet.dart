import 'package:flutter/material.dart';

import '../../core/colors.dart';

class IncidentSheet extends StatefulWidget {
  const IncidentSheet({
    super.key,
    required this.onReportDelay,
    required this.onMajorDelay,
    required this.onBreakdown,
  });

  final Future<void> Function(String message) onReportDelay;
  final Future<void> Function(String? message) onMajorDelay;
  final Future<void> Function() onBreakdown;

  static Future<void> show(
    BuildContext context, {
    required Future<void> Function(String message) onReportDelay,
    required Future<void> Function(String? message) onMajorDelay,
    required Future<void> Function() onBreakdown,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => IncidentSheet(
        onReportDelay: onReportDelay,
        onMajorDelay: onMajorDelay,
        onBreakdown: onBreakdown,
      ),
    );
  }

  @override
  State<IncidentSheet> createState() => _IncidentSheetState();
}

class _IncidentSheetState extends State<IncidentSheet> {
  final _messageController = TextEditingController();
  bool _busy = false;
  String? _selectedType;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(bottom: bottom),
      decoration: BoxDecoration(
        color: isDark ? AppDarkColors.scaffoldBackground : AppLightColors.scaffoldBackground,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                'Report Incident',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Select the type of incident and add details.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                ),
              ),
              const SizedBox(height: 20),

              // Incident type selector
              Row(
                children: [
                  _IncidentOption(
                    icon: Icons.schedule_rounded,
                    label: 'Delay',
                    color: Colors.orange,
                    selected: _selectedType == 'delay',
                    onTap: () => setState(() => _selectedType = 'delay'),
                  ),
                  const SizedBox(width: 10),
                  _IncidentOption(
                    icon: Icons.warning_rounded,
                    label: 'Major Delay',
                    color: Colors.deepOrange,
                    selected: _selectedType == 'major_delay',
                    onTap: () => setState(() => _selectedType = 'major_delay'),
                  ),
                  const SizedBox(width: 10),
                  _IncidentOption(
                    icon: Icons.car_crash_rounded,
                    label: 'Breakdown',
                    color: Colors.red,
                    selected: _selectedType == 'breakdown',
                    onTap: () => setState(() => _selectedType = 'breakdown'),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Message input (not for breakdown)
              if (_selectedType != null && _selectedType != 'breakdown') ...[
                TextField(
                  controller: _messageController,
                  enabled: !_busy,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: _selectedType == 'delay'
                        ? 'Describe the delay (e.g., traffic on MG Road)'
                        : 'Describe the situation (optional)',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: AppColors.orange, width: 2),
                    ),
                    filled: true,
                    fillColor: isDark ? AppDarkColors.panelBackground : AppLightColors.panelBackground,
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (_selectedType == 'breakdown') ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.red.withAlpha(15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withAlpha(40)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: Colors.red, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'This will report a vehicle breakdown and trigger route re-optimization.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.red,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Submit button
              if (_selectedType != null)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: FilledButton(
                    onPressed: _busy ? null : _handleSubmit,
                    style: FilledButton.styleFrom(
                      backgroundColor: _selectedType == 'breakdown'
                          ? Colors.red
                          : (_selectedType == 'major_delay' ? Colors.deepOrange : AppColors.orange),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    child: _busy
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                          )
                        : Text(_submitLabel),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String get _submitLabel {
    switch (_selectedType) {
      case 'delay':
        return 'Report Delay';
      case 'major_delay':
        return 'Report Major Delay';
      case 'breakdown':
        return 'Report Breakdown';
      default:
        return 'Submit';
    }
  }

  Future<void> _handleSubmit() async {
    setState(() => _busy = true);
    try {
      switch (_selectedType) {
        case 'delay':
          final message = _messageController.text.trim();
          if (message.isEmpty) {
            _showError('Please describe the delay.');
            return;
          }
          await widget.onReportDelay(message);
          break;
        case 'major_delay':
          await widget.onMajorDelay(
            _messageController.text.trim().isNotEmpty ? _messageController.text.trim() : null,
          );
          break;
        case 'breakdown':
          await widget.onBreakdown();
          break;
      }
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}

class _IncidentOption extends StatelessWidget {
  const _IncidentOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? color.withAlpha(20) : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? color : (Theme.of(context).brightness == Brightness.dark
                  ? AppDarkColors.panelBorder
                  : AppLightColors.panelBorder),
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? color : (Theme.of(context).brightness == Brightness.dark
                  ? AppDarkColors.textSecondary
                  : AppLightColors.textSecondary), size: 26),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? color : (Theme.of(context).brightness == Brightness.dark
                      ? AppDarkColors.textSecondary
                      : AppLightColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
