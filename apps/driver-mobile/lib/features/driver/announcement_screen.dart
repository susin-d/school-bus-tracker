import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../core/colors.dart';
import 'driver_api.dart';

class AnnouncementScreen extends StatefulWidget {
  const AnnouncementScreen({super.key});

  @override
  State<AnnouncementScreen> createState() => _AnnouncementScreenState();
}

class _AnnouncementScreenState extends State<AnnouncementScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _busy = false;
  final List<Map<String, dynamic>> _messages = [];

  DriverApi _buildApi() {
    final user = AppScope.of(context).currentUser!;
    return DriverApi(
      ApiClient(
        userId: user.id,
        accessToken: user.accessToken,
      ),
    );
  }

  Future<void> _sendAnnouncement(String text) async {
    if (text.trim().isEmpty) return;

    setState(() => _busy = true);
    try {
      final trip = AppScope.of(context).currentTrip;
      if (trip == null) {
        throw Exception('No active trip found to announce for.');
      }

      final api = _buildApi();
      await api.reportDelay(
        tripId: trip.id,
        message: text.trim(),
        severity: 'medium',
      );

      if (mounted) {
        setState(() {
          _messages.insert(0, {
            'text': text.trim(),
            'time': DateTime.now(),
            'isMe': true,
          });
          _controller.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Announcement sent to parents and admin.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Make Announcement'),
      ),
      body: Column(
        children: [
          // Emergency Notice
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: Colors.red.withAlpha(20),
            child: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Colors.orange),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Use this for emergency situations like tyre punctures or unpredictable delays.',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange),
                  ),
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: ListView.builder(
              reverse: true,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                return Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8, left: 40),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.orange,
                      borderRadius: BorderRadius.circular(16).copyWith(bottomRight: Radius.zero),
                    ),
                    child: Text(
                      msg['text'],
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                );
              },
            ),
          ),

          // Quick Buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              children: [
                ActionChip(
                  label: const Text('Running Late'),
                  avatar: const Icon(Icons.timer_outlined, size: 16),
                  onPressed: () => _sendAnnouncement('Running late'),
                ),
                ActionChip(
                  label: const Text('Traffic Delay'),
                  avatar: const Icon(Icons.traffic_outlined, size: 16),
                  onPressed: () => _sendAnnouncement('Traffic delay'),
                ),
                ActionChip(
                  label: const Text('Tyre Puncture'),
                  avatar: const Icon(Icons.build_outlined, size: 16),
                  onPressed: () => _sendAnnouncement('Tyre puncture emergency'),
                ),
              ],
            ),
          ),

          // Input Area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppDarkColors.panelBackground : Colors.white,
              border: Border(top: BorderSide(color: isDark ? AppDarkColors.panelBorder : AppLightColors.panelBorder)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: const InputDecoration(
                        hintText: 'Type custom message...',
                        border: InputBorder.none,
                      ),
                      onSubmitted: _sendAnnouncement,
                    ),
                  ),
                  _busy
                      ? const SizedBox(width: 48, child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
                      : IconButton(
                          onPressed: () => _sendAnnouncement(_controller.text),
                          icon: const Icon(Icons.send_rounded, color: AppColors.orange),
                        ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
