import 'dart:convert';
import 'dart:io';

class ApiClient {
  ApiClient({
    required this.userId,
    this.accessToken,
    String? baseUrl,
  }) : _baseUrl = _resolveBaseUrl(baseUrl).replaceAll(RegExp(r'/$'), '');

  final String userId;
  final String? accessToken;
  final String _baseUrl;

  static String _resolveBaseUrl(String? baseUrl) {
    final explicit = (baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: '')).trim();
    if (explicit.isNotEmpty) {
      return explicit;
    }

    // Android emulator cannot reach host machine via localhost.
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000';
    }
    return 'http://localhost:4000';
  }

  Future<dynamic> get(String path) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = await HttpClient().getUrl(uri);
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    _applyAuthHeaders(request);
    final response = await request.close();
    return _decodeResponse(response);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = await HttpClient().postUrl(uri);
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    _applyAuthHeaders(request);
    request.write(jsonEncode(body));
    final response = await request.close();
    return _decodeResponse(response);
  }

  void _applyAuthHeaders(HttpClientRequest request) {
    if (accessToken != null && accessToken!.trim().isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer ${accessToken!.trim()}');
      return;
    }

    if (userId.trim().isNotEmpty) {
      request.headers.set('x-user-id', userId);
    }
  }

  Future<dynamic> _decodeResponse(HttpClientResponse response) async {
    final raw = await utf8.decodeStream(response);
    final hasBody = raw.trim().isNotEmpty;
    final decoded = hasBody ? jsonDecode(raw) : null;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final message = decoded is Map<String, dynamic> && decoded['error'] is String
        ? decoded['error'] as String
        : 'Request failed with status ${response.statusCode}';
    throw HttpException(message);
  }
}
