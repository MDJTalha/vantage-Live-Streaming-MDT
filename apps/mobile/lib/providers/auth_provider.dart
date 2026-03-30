import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;
  bool _isLoading = false;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;

  Future<bool> checkAuthStatus() async {
    final token = await _storage.read(key: 'access_token');
    _isAuthenticated = token != null;
    
    if (_isAuthenticated) {
      await _loadUser();
    }
    
    notifyListeners();
    return _isAuthenticated;
  }

  Future<void> _loadUser() async {
    try {
      // In production, fetch user from API
      // For now, use stored data
      final userData = await _storage.read(key: 'user_data');
      if (userData != null) {
        _user = Map<String, dynamic>.from(
          Map<String, dynamic>.fromJson(userData),
        );
      }
    } catch (e) {
      print('Error loading user: $e');
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      // In production, call API
      // For demo, simulate login
      await Future.delayed(const Duration(seconds: 1));
      
      _user = {
        'email': email,
        'name': email.split('@').first,
        'id': 'demo-user-id',
      };
      
      await _storage.write(key: 'user_data', value: _user);
      _isAuthenticated = true;
    } catch (e) {
      _isAuthenticated = false;
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String email, String password, String name) async {
    _isLoading = true;
    notifyListeners();

    try {
      // In production, call API
      await Future.delayed(const Duration(seconds: 1));
      
      _user = {
        'email': email,
        'name': name,
        'id': 'demo-user-id',
      };
      
      await _storage.write(key: 'user_data', value: _user);
      _isAuthenticated = true;
    } catch (e) {
      _isAuthenticated = false;
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
    await _storage.delete(key: 'user_data');
    
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
