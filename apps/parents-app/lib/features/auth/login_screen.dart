import 'package:flutter/material.dart';

import '../../core/app_scope.dart';
import 'auth_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginFormKey = GlobalKey<FormState>();
  final _forgotFormKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _forgotEmailController = TextEditingController();
  final _redirectController = TextEditingController(
    text: const String.fromEnvironment('AUTH_REDIRECT_URL', defaultValue: ''),
  );

  final _authApi = AuthApi();

  bool _busy = false;
  bool _obscurePassword = true;
  bool _showForgotPassword = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _forgotEmailController.dispose();
    _redirectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Stack(
              children: [
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          colorScheme.primaryContainer.withValues(alpha: 0.5),
                          theme.scaffoldBackgroundColor,
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: -40,
                  right: -20,
                  child: _buildGlowCircle(
                    colorScheme.secondaryContainer.withValues(alpha: 0.75),
                    140,
                  ),
                ),
                Positioned(
                  bottom: 60,
                  left: -35,
                  child: _buildGlowCircle(
                    colorScheme.primaryContainer.withValues(alpha: 0.65),
                    120,
                  ),
                ),
                SingleChildScrollView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: ConstrainedBox(
                    constraints:
                        BoxConstraints(minHeight: constraints.maxHeight - 48),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(22),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildIntroPanel(theme),
                                const SizedBox(height: 16),
                                if (_errorMessage != null ||
                                    _successMessage != null) ...[
                                  _buildMessageBanner(theme),
                                  const SizedBox(height: 14),
                                ],
                                _buildLoginForm(theme),
                                const SizedBox(height: 10),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: _busy
                                        ? null
                                        : () {
                                            setState(() {
                                              _showForgotPassword =
                                                  !_showForgotPassword;
                                              _clearMessages();
                                            });
                                          },
                                    child: Text(
                                      _showForgotPassword
                                          ? 'Hide forgot password'
                                          : 'Forgot password?',
                                    ),
                                  ),
                                ),
                                if (_showForgotPassword) ...[
                                  const SizedBox(height: 4),
                                  _buildForgotPasswordForm(theme),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildGlowCircle(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }

  Widget _buildIntroPanel(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colorScheme.primaryContainer,
            colorScheme.secondaryContainer,
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SchoolBus Bridge',
            style: theme.textTheme.labelLarge?.copyWith(
              color: colorScheme.primary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Parent Login',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Track routes, attendance, leave requests, and alerts in one secure place.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: const [
              _QuickPill(label: 'Live ETA'),
              _QuickPill(label: 'Attendance'),
              _QuickPill(label: 'Alerts'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm(ThemeData theme) {
    return Form(
      key: _loginFormKey,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sign In',
                style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email],
              enabled: !_busy,
              validator: _validateEmail,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'parent@school.com',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              enabled: !_busy,
              validator: (value) {
                final password = (value ?? '').trim();
                if (password.isEmpty) {
                  return 'Password is required.';
                }
                if (password.length < 8) {
                  return 'Password must be at least 8 characters.';
                }
                return null;
              },
              onFieldSubmitted: (_) {
                if (!_busy) {
                  _handleEmailPasswordLogin();
                }
              },
              decoration: InputDecoration(
                labelText: 'Password',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  onPressed: _busy
                      ? null
                      : () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                  icon: Icon(_obscurePassword
                      ? Icons.visibility
                      : Icons.visibility_off),
                ),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _busy ? null : _handleEmailPasswordLogin,
                child: Text(_busy ? 'Signing in...' : 'Sign In'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForgotPasswordForm(ThemeData theme) {
    return Form(
      key: _forgotFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Reset your password', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Enter your registered email to receive reset instructions.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _forgotEmailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.email],
            enabled: !_busy,
            validator: _validateEmail,
            onFieldSubmitted: (_) {
              if (!_busy) {
                _handleForgotPassword();
              }
            },
            decoration: const InputDecoration(
              labelText: 'Registered Email',
              hintText: 'parent@school.com',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton.tonal(
              onPressed: _busy ? null : _handleForgotPassword,
              child: const Text('Send Reset Email'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBanner(ThemeData theme) {
    final isError = _errorMessage != null;
    final content = _errorMessage ?? _successMessage ?? '';
    final bannerColor = isError
        ? theme.colorScheme.errorContainer
        : theme.colorScheme.primaryContainer;
    final textColor = isError
        ? theme.colorScheme.onErrorContainer
        : theme.colorScheme.onPrimaryContainer;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bannerColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        content,
        style: theme.textTheme.bodyMedium?.copyWith(color: textColor),
      ),
    );
  }

  Future<void> _handleEmailPasswordLogin() async {
    if (!_loginFormKey.currentState!.validate()) {
      return;
    }

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    await _runAsync(() async {
      final session = await _authApi.signInWithEmailPassword(
        email: email,
        password: password,
      );
      if (!mounted) {
        return;
      }
      AppScope.of(context).signIn(
        userId: session.userId,
        fullName: session.fullName,
        role: session.role,
        accessToken: session.token,
      );
    });
  }

  Future<void> _handleForgotPassword() async {
    if (!_forgotFormKey.currentState!.validate()) {
      return;
    }

    final email = _forgotEmailController.text.trim();
    await _runAsync(() async {
      await _authApi.sendForgotPassword(
        email: email,
        redirectTo: _redirectController.text.trim().isEmpty
            ? null
            : _redirectController.text.trim(),
      );
      _setSuccess('Password reset email sent. Please check your inbox.');
    });
  }

  Future<void> _runAsync(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _clearMessages();
    });
    try {
      await action();
    } catch (error) {
      _setError(_readableError(error));
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  String? _validateEmail(String? value) {
    final email = (value ?? '').trim();
    if (email.isEmpty) {
      return 'Email is required.';
    }
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(email)) {
      return 'Enter a valid email address.';
    }
    return null;
  }

  void _clearMessages() {
    _errorMessage = null;
    _successMessage = null;
  }

  void _setError(String message) {
    if (!mounted) {
      return;
    }
    setState(() {
      _errorMessage = message;
      _successMessage = null;
    });
  }

  void _setSuccess(String message) {
    if (!mounted) {
      return;
    }
    setState(() {
      _successMessage = message;
      _errorMessage = null;
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

class _QuickPill extends StatelessWidget {
  const _QuickPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colorScheme.surface.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}
