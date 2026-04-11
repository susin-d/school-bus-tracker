import 'package:flutter/material.dart';

import '../../core/app_scope.dart';
import '../../core/colors.dart';
import 'driver_api.dart';
import '../../core/api_client.dart';

class StudentListScreen extends StatefulWidget {
  const StudentListScreen({super.key});

  @override
  State<StudentListScreen> createState() => _StudentListScreenState();
}

class _StudentListScreenState extends State<StudentListScreen> {
  bool _loading = false;
  List<Map<String, dynamic>> _students = [];

  @override
  void initState() {
    super.initState();
    _loadStudents();
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

  Future<void> _loadStudents() async {
    setState(() => _loading = true);
    try {
      final appState = AppScope.of(context);
      final trip = appState.currentTrip;
      if (trip == null) {
        setState(() {
          _students = [];
          _loading = false;
        });
        return;
      }

      final api = _buildApi();
      final manifest = await api.getTripManifest(trip.id);
      final stops = (manifest['stops'] as List<dynamic>?)
              ?.map((s) => s as Map<String, dynamic>)
              .toList() ??
          [];

      // In a real app, we might have a specific endpoint for all students on bus.
      // Here we derive it from the manifest stops.
      final List<Map<String, dynamic>> students = [];
      for (final stop in stops) {
        if (stop['studentId'] != null) {
          students.add({
            'id': stop['studentId'],
            'name': stop['studentName'] ?? 'Unknown Student',
            'status': stop['stopStatus'] ?? 'scheduled',
            'photoUrl': stop['studentPhotoUrl'] as String?, // Assuming field name
          });
        }
      }

      // Sorting Logic:
      // 1. Present students (scheduled, arrived, boarded) in alphabetical order
      // 2. Absentees (no_show, skipped) at the last in alphabetical order
      students.sort((a, b) {
        final aAbsent = a['status'] == 'no_show' || a['status'] == 'skipped';
        final bAbsent = b['status'] == 'no_show' || b['status'] == 'skipped';

        if (aAbsent != bAbsent) {
          return aAbsent ? 1 : -1;
        }

        return (a['name'] as String).compareTo(b['name'] as String);
      });

      setState(() {
        _students = students;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading students: $e')),
        );
      }
      setState(() => _loading = false);
    }
  }

  void _showStudentProfile(Map<String, dynamic> student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: AppColors.orange.withAlpha(20),
              child: student['photoUrl'] != null
                  ? ClipOval(child: Image.network(student['photoUrl'], fit: BoxFit.cover))
                  : Icon(Icons.person, size: 50, color: AppColors.orange),
            ),
            const SizedBox(height: 16),
            Text(
              student['name'],
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Status: ${student['status'].toString().toUpperCase()}',
              style: TextStyle(
                color: student['status'] == 'boarded' ? Colors.green : Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(height: 32),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Additional details from database...', style: TextStyle(fontStyle: FontStyle.italic)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Students List'),
        actions: [
          IconButton(
            onPressed: _loadStudents,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _students.isEmpty
              ? const Center(child: Text('No students found for this trip.'))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _students.length,
                  itemBuilder: (context, index) {
                    final student = _students[index];
                    final isAbsent = student['status'] == 'no_show' || student['status'] == 'skipped';
                    final isPresent = student['status'] == 'boarded';

                    return ListTile(
                      onTap: () => _showStudentProfile(student),
                      leading: CircleAvatar(
                        backgroundColor: isDark ? Colors.grey[800] : Colors.grey[200],
                        child: student['photoUrl'] != null
                            ? ClipOval(child: Image.network(student['photoUrl'], fit: BoxFit.cover))
                            : const Icon(Icons.person),
                      ),
                      title: Text(
                        student['name'],
                        style: TextStyle(
                          decoration: isAbsent ? TextDecoration.lineThrough : null,
                          color: isAbsent ? Colors.grey : null,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      trailing: isPresent
                          ? const Icon(Icons.check_circle_rounded, color: Colors.green)
                          : isAbsent
                              ? const Icon(Icons.cancel_rounded, color: Colors.red)
                              : const Icon(Icons.radio_button_unchecked, color: Colors.grey),
                    );
                  },
                ),
    );
  }
}
