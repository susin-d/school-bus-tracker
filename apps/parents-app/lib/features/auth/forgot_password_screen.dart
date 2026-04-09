import 'package:flutter/material.dart';

import 'auth_api.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({
    super.key,
    this.initialEmail,
  });

  final String? initialEmail;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _redirectController = TextEditingController(
    text: const String.fromEnvironment('AUTH_REDIRECT_URL', defaultValue: ''),
  );
  late final TextEditingController _emailController;
  final _authApi = AuthApi();

  bool _busy = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _redirectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Forgot Password')),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              child: ConstrainedBox(
                constraints:
                    BoxConstraints(minHeight: constraints.maxHeight - 40),
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
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: colorScheme.primaryContainer
                                    .withValues(alpha: 0.75),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.mark_email_read_outlined,
                                    color: colorScheme.primary,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'We will send reset instructions to your registered email.',
                                      style: theme.textTheme.bodyMedium,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            if (_errorMessage != null ||
                                _successMessage != null) ...[
                              _buildMessageBanner(theme),
                              const SizedBox(height: 14),
                            ],
                            Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  TextFormField(
                                    controller: _emailController,
                                    keyboardType: TextInputType.emailAddress,
                                    textInputAction: TextInputAction.next,
                                    autofillHints: const [AutofillHints.email],
                                    enabled: !_busy,
                                    validator: _validateEmail,
                                    decoration: const InputDecoration(
                                      labelText: 'Registered Email',
                                      hintText: 'parent@school.com',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  TextFormField(
                                    controller: _redirectController,
                                    textInputAction: TextInputAction.done,
                                    enabled: !_busy,
                                    decoration: const InputDecoration(
                                      labelText: 'Redirect URL (optional)',
                                      hintText:
                                          'https://app.example.com/auth/callback',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton(
                                      onPressed: _busy ? null : _handleSubmit,
                                      child: Text(_busy
                                          ? 'Sending...'
                                          : 'Send Reset Email'),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  SizedBox(
                                    width: double.infinity,
                                    child: TextButton(
                                      onPressed: _busy
                                          ? null
                                          : () => Navigator.of(context).pop(),
                                      child: const Text('Back to Login'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildMessageBanner(ThemeData theme) {
    final isError = _errorMessage != null;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError
            ? theme.colorScheme.errorContainer
            : theme.colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _errorMessage ?? _successMessage ?? '',
        style: theme.textTheme.bodyMedium?.copyWith(
          color: isError
              ? theme.colorScheme.onErrorContainer
              : theme.colorScheme.onPrimaryContainer,
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final email = _emailController.text.trim();
    final redirect = _redirectController.text.trim();

    setState(() {
      _busy = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      await _authApi.sendForgotPassword(
        email: email,
        redirectTo: redirect.isEmpty ? null : redirect,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _successMessage = 'Password reset email sent. Please check your inbox.';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = _readableError(error);
      });
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
