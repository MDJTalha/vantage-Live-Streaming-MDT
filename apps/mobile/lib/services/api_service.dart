import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final String baseUrl;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService({this.baseUrl = 'http://localhost:4000'});

  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/login'),
      headers: await _getHeaders(),
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _storage.write(key: 'access_token', value: data['data']['tokens']['accessToken']);
      await _storage.write(key: 'refresh_token', value: data['data']['tokens']['refreshToken']);
      return data['data'];
    } else {
      throw Exception('Login failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> register(String email, String password, String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/register'),
      headers: await _getHeaders(),
      body: jsonEncode({'email': email, 'password': password, 'name': name}),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await _storage.write(key: 'access_token', value: data['data']['tokens']['accessToken']);
      return data['data'];
    } else {
      throw Exception('Registration failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/v1/auth/me'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to get user: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> createRoom({
    required String name,
    String? description,
    Map<String, dynamic>? settings,
    String? password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/rooms'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'name': name,
        'description': description,
        'settings': settings,
        'password': password,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create room: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getRoom(String roomCode) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/v1/rooms/$roomCode'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Room not found: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> joinRoom(String roomCode, {String? password}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/rooms/$roomCode/join'),
      headers: await _getHeaders(),
      body: jsonEncode({'password': password}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to join room: ${response.body}');
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}
