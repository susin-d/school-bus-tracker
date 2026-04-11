import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/app_scope.dart';
import '../../core/colors.dart';
import 'auth_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authApi = AuthApi();

  bool _busy = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: screenHeight - MediaQuery.of(context).padding.vertical),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(height: screenHeight * 0.08),

                  // Logo / Brand
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.orange, AppColors.orangeStrong],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.orange.withAlpha(80),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.directions_bus_rounded,
                      color: Colors.white,
                      size: 42,
                    ),
                  ),
                  const SizedBox(height: 28),

                  Text(
                    'SchoolBus',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                      fontSize: 34,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Driver',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      color: AppColors.orange,
                      fontWeight: FontWeight.w900,
                      fontSize: 34,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Sign in to start your trip',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Email field
                  Text(
                    'Email',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    enabled: !_busy,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: 'driver@school.com',
                      prefixIcon: const Icon(Icons.email_outlined),
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
                  const SizedBox(height: 20),

                  // Password field
                  Text(
                    'Password',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    enabled: !_busy,
                    onSubmitted: (_) => _handleLogin(),
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDark ? AppDarkColors.textPrimary : AppLightColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: '••••••••',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                          color: isDark ? AppDarkColors.textSecondary : AppLightColors.textSecondary,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
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
                  const SizedBox(height: 28),

                  // Sign in button
                  SizedBox(
                    height: 54,
                    child: FilledButton(
                      onPressed: _busy ? null : _handleLogin,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.orange,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: AppColors.orange.withAlpha(120),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      child: _busy
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Sign In'),
                    ),
                  ),

                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.error.withAlpha(20),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: theme.colorScheme.error.withAlpha(60)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline_rounded, color: theme.colorScheme.error, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty) {
      setState(() => _errorMessage = 'Please enter your email.');
      return;
    }
    if (password.isEmpty) {
      setState(() => _errorMessage = 'Please enter your password.');
      return;
    }

    setState(() {
      _busy = true;
      _errorMessage = null;
    });

    try {
      final session = await _authApi.login(email: email, password: password);
      if (!mounted) return;
      AppScope.of(context).signIn(
        userId: session.userId,
        fullName: session.fullName,
        role: AppRole.driver,
        accessToken: session.token,
        gender: session.gender,
        dateOfBirth: session.dateOfBirth,
      );

    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = _readableError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _readableError(Object error) {
    final raw = error.toString();
    if (raw.startsWith('HttpException: ')) {
      return raw.replaceFirst('HttpException: ', '');
    }
    if (raw.startsWith('FormatException: ')) {
      return raw.replaceFirst('FormatException: ', '');
    }
    return 'Invalid email or password. Please try again.';
  }
}
