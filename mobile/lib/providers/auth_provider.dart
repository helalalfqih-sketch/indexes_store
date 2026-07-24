import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum UserRole { shopper, seller, admin }

class AuthProvider extends ChangeNotifier {
  UserRole _role = UserRole.shopper;
  bool _isLoggedIn = true;
  String _userEmail = 'customer@indexes-store.com';
  String _userName = 'عميل مميز';

  UserRole get role => _role;
  bool get isLoggedIn => _isLoggedIn;
  String get userEmail => _userEmail;
  String get userName => _userName;

  AuthProvider() {
    _loadRolePreference();
  }

  Future<void> _loadRolePreference() async {
    final prefs = await SharedPreferences.getInstance();
    final savedRole = prefs.getString('user_role');
    if (savedRole == 'seller') {
      _role = UserRole.seller;
    } else if (savedRole == 'admin') {
      _role = UserRole.admin;
    } else {
      _role = UserRole.shopper;
    }
    notifyListeners();
  }

  Future<void> setRole(UserRole role) async {
    _role = role;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_role', role.name);
    notifyListeners();
  }

  void login(String email, String name) {
    _isLoggedIn = true;
    _userEmail = email;
    _userName = name;
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    notifyListeners();
  }
}
