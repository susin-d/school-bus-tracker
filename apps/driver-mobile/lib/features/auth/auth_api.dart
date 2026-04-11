import '../../core/api_client.dart';
import '../../core/app_state.dart';

class AuthApi {
  AuthApi({String? baseUrl})
      : _client = ApiClient(
          userId: '',
          baseUrl: baseUrl,
        );

  final ApiClient _client;

  Future<VerifiedSession> login({
    required String email,
    required String password,
  }) async {
    final payload = await _client.post('/auth/email-login', {
      'email': email,
      'password': password,
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
      fullName: user['fullName'] as String? ?? 'Driver',
      role: AppRole.driver,
    );
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
