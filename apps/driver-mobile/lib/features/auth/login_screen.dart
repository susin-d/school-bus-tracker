import 'package:flutter/material.dart';

import '../../core/api_access.dart';
import '../../core/app_scope.dart';
import 'auth_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _nameController = TextEditingController();
  final _userIdController = TextEditingController(text: 'driver-1');
  final _accessTokenController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _emailController = TextEditingController();
  final _redirectController = TextEditingController(
    text: const String.fromEnvironment('AUTH_REDIRECT_URL', defaultValue: ''),
  );

  final _authApi = AuthApi();

  bool _busy = false;
  String _feedback = '';

  @override
  void dispose() {
    _nameController.dispose();
    _userIdController.dispose();
    _accessTokenController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    _emailController.dispose();
    _redirectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            Text(
              'SchoolBus Driver',
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text('Login', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 12),
            Text(
              'Dedicated driver app for trip control, attendance, and safety workflows.',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            _buildOtpCard(theme),
            const SizedBox(height: 16),
            _buildEmailCard(theme),
            const SizedBox(height: 16),
            _buildDevCard(theme),
            if (_feedback.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                _feedback,
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOtpCard(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Phone OTP', style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
            const SizedBox(height: 10),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(
                hintText: '+919999999999',
                labelText: 'Phone Number',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _otpController,
              decoration: const InputDecoration(
                hintText: '123456',
                labelText: 'OTP',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.tonal(
                  onPressed: _busy ? null : _handleSendOtp,
                  child: const Text('Send OTP'),
                ),
                FilledButton(
                  onPressed: _busy ? null : _handleVerifyOtp,
                  child: const Text('Verify OTP & Sign In'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmailCard(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Email Actions', style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
            const SizedBox(height: 10),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                hintText: 'name@school.com',
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _redirectController,
              decoration: const InputDecoration(
                hintText: 'https://app.example.com/auth/callback',
                labelText: 'Redirect URL (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.tonal(
                  onPressed: _busy ? null : _handleForgotPassword,
                  child: const Text('Send Reset Email'),
                ),
                FilledButton.tonal(
                  onPressed: _busy ? null : _handleSendVerification,
                  child: const Text('Send Verification Email'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDevCard(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dev Login', style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
            const SizedBox(height: 10),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                hintText: 'Enter your name',
                labelText: 'Full name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _userIdController,
              decoration: const InputDecoration(
                hintText: 'driver-1',
                labelText: 'User ID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _accessTokenController,
              decoration: const InputDecoration(
                hintText: 'Bearer token for real auth mode',
                labelText: 'Access Token (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                key: const Key('continue_button'),
                onPressed: _busy ? null : _handleDevSignIn,
                child: const Text('Continue (Dev)'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      _setFeedback('Phone number is required.');
      return;
    }
    await _runAsync(() async {
      await _authApi.sendOtp(phone);
      _setFeedback('OTP sent successfully.');
    });
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    if (phone.isEmpty || otp.isEmpty) {
      _setFeedback('Phone number and OTP are required.');
      return;
    }
    await _runAsync(() async {
      final session = await _authApi.verifyOtp(phone: phone, otp: otp);
      if (!mounted) {
        return;
      }
      AppScope.of(context).signIn(
        userId: session.userId,
        fullName: session.fullName,
        role: AppRole.driver,
        accessToken: session.token,
      );
    });
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _setFeedback('Email is required for password reset.');
      return;
    }
    await _runAsync(() async {
      await _authApi.sendForgotPassword(
        email: email,
        redirectTo: _redirectController.text.trim(),
      );
      _setFeedback('Password reset email sent.');
    });
  }

  Future<void> _handleSendVerification() async {
    final email = _emailController.text.trim();
    final fullName = _nameController.text.trim().isEmpty ? 'SchoolBus User' : _nameController.text.trim();
    if (email.isEmpty) {
      _setFeedback('Email is required for verification.');
      return;
    }
    await _runAsync(() async {
      await _authApi.sendVerificationEmail(
        email: email,
        fullName: fullName,
        redirectTo: _redirectController.text.trim(),
      );
      _setFeedback('Verification and welcome emails sent.');
    });
  }

  void _handleDevSignIn() {
    final userId = _userIdController.text.trim().isEmpty ? 'driver-1' : _userIdController.text.trim();
    final fullName = _nameController.text.trim().isEmpty ? 'Driver User' : _nameController.text.trim();

    AppScope.of(context).signIn(
      userId: userId,
      fullName: fullName,
      role: AppRole.driver,
      accessToken: _accessTokenController.text.trim().isEmpty ? null : _accessTokenController.text.trim(),
    );
  }

  Future<void> _runAsync(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _feedback = '';
    });
    try {
      await action();
    } catch (error) {
      _setFeedback(_readableError(error));
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  void _setFeedback(String message) {
    if (!mounted) {
      return;
    }
    setState(() {
      _feedback = message;
    });
  }

  String _readableError(Object error) {
    final raw = error.toString();
    if (raw.startsWith('HttpException: ')) {
      return raw.replaceFirst('HttpException: ', '');
    }
    if (raw.startsWith('FormatException: ')) {
      return raw.replaceFirst('FormatException: ', '');
    }
    return raw;
  }
}
