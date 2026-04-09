import 'package:flutter/material.dart';

import '../../core/app_scope.dart';
import 'auth_api.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginFormKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  final _authApi = AuthApi();

  bool _busy = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
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
                    colorScheme.primaryContainer.withValues(alpha: 0.45),
                    140,
                  ),
                ),
                Positioned(
                  bottom: 60,
                  left: -35,
                  child: _buildGlowCircle(
                    colorScheme.secondaryContainer.withValues(alpha: 0.4),
                    120,
                  ),
                ),
                SingleChildScrollView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                  child: ConstrainedBox(
                    constraints:
                        BoxConstraints(minHeight: constraints.maxHeight),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Card(
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                                minHeight: constraints.maxHeight - 20),
                            child: Padding(
                              padding: const EdgeInsets.all(22),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'SchoolBus Bridge',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      color: colorScheme.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 18),
                                  if (_errorMessage != null) ...[
                                    _buildMessageBanner(theme),
                                    const SizedBox(height: 14),
                                  ],
                                  _buildLoginForm(theme),
                                  const SizedBox(height: 10),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed:
                                          _busy ? null : _openForgotPassword,
                                      child: const Text('Forgot password?'),
                                    ),
                                  ),
                                ],
                              ),
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

  Widget _buildMessageBanner(ThemeData theme) {
    final content = _errorMessage ?? '';
    final bannerColor = theme.colorScheme.errorContainer;
    final textColor = theme.colorScheme.onErrorContainer;

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

  Future<void> _openForgotPassword() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            ForgotPasswordScreen(initialEmail: _emailController.text.trim()),
      ),
    );
  }

  Future<void> _runAsync(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _errorMessage = null;
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

  void _setError(String message) {
    if (!mounted) {
      return;
    }
    setState(() {
      _errorMessage = message;
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
