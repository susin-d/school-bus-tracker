import 'package:flutter/material.dart';
import '../core/app_scope.dart';
import '../core/colors.dart';
import '../features/driver/student_list_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AppScope.of(context).currentUser;
    if (user == null) return const Drawer(child: Center(child: CircularProgressIndicator()));

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Drawer(
      backgroundColor: isDark ? AppDarkColors.scaffoldBackground : AppLightColors.scaffoldBackground,
      child: Column(
        children: [
          _buildHeader(context, user, isDark),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _DrawerTile(
                  icon: Icons.dashboard_rounded,
                  label: 'Dashboard',
                  isActive: true,
                  onTap: () => Navigator.pop(context),
                ),
                _DrawerTile(
                  icon: Icons.people_alt_rounded,
                  label: 'Student List',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const StudentListScreen()),
                    );
                  },
                ),
                _DrawerTile(
                  icon: Icons.notifications_rounded,
                  label: 'Notifications',
                  onTap: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Notifications coming soon!')),
                    );
                  },
                ),
                _DrawerTile(
                  icon: Icons.history_rounded,
                  label: 'Trip History',
                  onTap: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('History coming soon!')),
                    );
                  },
                ),
                const Divider(indent: 20, endIndent: 20),
                _DrawerTile(
                  icon: Icons.settings_rounded,
                  label: 'Settings',
                  onTap: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Settings coming soon!')),
                    );
                  },
                ),
              ],
            ),
          ),
          _buildFooter(context, isDark),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, user, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 24),
      decoration: BoxDecoration(
        gradient: AppColors.surakshaOrangeGradient,
        borderRadius: BorderRadius.only(
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const CircleAvatar(
              radius: 36,
              backgroundColor: Color(0xFFFFF3E0),
              child: Icon(Icons.person, size: 40, color: AppColors.orange),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            user.fullName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            'Driver ID: ${user.id.length > 8 ? user.id.substring(0, 8).toUpperCase() : user.id.toUpperCase()}',
            style: TextStyle(
              color: Colors.white.withAlpha(200),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: InkWell(
        onTap: () {
          Navigator.pop(context);
          AppScope.of(context).signOut();
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: Colors.redAccent.withAlpha(20),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.logout_rounded, color: Colors.redAccent),
              SizedBox(width: 12),
              Text(
                'Sign Out',
                style: TextStyle(
                  color: Colors.redAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isActive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        leading: Icon(
          icon,
          color: isActive 
              ? AppColors.orange 
              : (isDark ? Colors.white70 : Colors.black54),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            color: isActive 
                ? AppColors.orange 
                : (isDark ? Colors.white : Colors.black87),
          ),
        ),
        tileColor: isActive 
            ? AppColors.orange.withAlpha(isDark ? 30 : 20) 
            : Colors.transparent,
      ),
    );
  }
}
