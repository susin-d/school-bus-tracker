import '../../core/api_client.dart';
import '../../core/api_access.dart';

class AuthApi {
  AuthApi({String? baseUrl})
      : _client = ApiClient(
          userId: '',
          baseUrl: baseUrl,
        );

  final ApiClient _client;

  Future<void> sendOtp(String phone) async {
    await _client.post('/auth/otp/send', {
      'phone': phone,
    });
  }

  Future<VerifiedSession> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    final payload = await _client.post('/auth/otp/verify', {
      'phone': phone,
      'otp': otp,
    }) as Map<String, dynamic>;

    final token = payload['token'] as String? ?? '';
    final user = payload['user'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    if (user['role'] != 'driver') {
      throw const FormatException('This account is not allowed in the driver app.');
    }

    final userId = user['id'] as String? ?? '';
    if (token.isEmpty || userId.isEmpty) {
      throw const FormatException('Invalid auth session response.');
    }

    return VerifiedSession(
      token: token,
      userId: userId,
      fullName: user['fullName'] as String? ?? 'Driver User',
      role: AppRole.driver,
    );
  }

  Future<void> sendForgotPassword({
    required String email,
    String? redirectTo,
  }) async {
    await _client.post('/auth/forgot-password', {
      'email': email,
      if (redirectTo != null && redirectTo.trim().isNotEmpty)
        'redirectTo': redirectTo.trim(),
    });
  }

  Future<void> sendVerificationEmail({
    required String email,
    required String fullName,
    String? redirectTo,
  }) async {
    await _client.post('/auth/email/send-verification', {
      'email': email,
      'fullName': fullName,
      if (redirectTo != null && redirectTo.trim().isNotEmpty)
        'redirectTo': redirectTo.trim(),
    });
  }

}

class VerifiedSession {
  const VerifiedSession({
    required this.token,
    required this.userId,
    required this.fullName,
    required this.role,
  });

  final String token;
  final String userId;
  final String fullName;
  final AppRole role;
}
