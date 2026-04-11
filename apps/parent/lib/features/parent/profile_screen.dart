import 'package:flutter/material.dart';
import '../../core/app_scope.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AppScope.of(context).currentUser!;
    final theme = Theme.of(context);

    // Default email if not available in current session
    final email = 'parent@suraksha.com'; // Placeholder
    final phone = '+91 98765 43210'; // Placeholder

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              child: Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: theme.colorScheme.onPrimary,
                      child: Icon(Icons.person, size: 50, color: theme.colorScheme.primary),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user.fullName,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: theme.colorScheme.onPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Parent User ID: ${user.id}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onPrimary.withAlpha(200),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle(theme, 'Contact Information'),
                  const SizedBox(height: 16),
                  _buildProfileTile(Icons.email_outlined, 'Email Address', email),
                  _buildProfileTile(Icons.phone_outlined, 'Phone Number', phone),
                  const Divider(height: 48),
                  _buildSectionTitle(theme, 'Account Settings'),
                  const SizedBox(height: 16),
                  ListTile(
                    onTap: () {}, // No edit functionality yet, as per user requirement to just 'add section'
                    leading: const Icon(Icons.settings_outlined),
                    title: const Text('Account Preferences'),
                    trailing: const Icon(Icons.chevron_right),
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.colorScheme.error,
                        side: BorderSide(color: theme.colorScheme.error),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        AppScope.of(context).signOut();
                      },
                      child: const Text('SIGN OUT', style: TextStyle(fontWeight: FontWeight.bold)),
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

  Widget _buildSectionTitle(ThemeData theme, String title) {
    return Text(
      title,
      style: theme.textTheme.titleMedium?.copyWith(
        color: theme.colorScheme.primary,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildProfileTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 24, color: Colors.grey),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
