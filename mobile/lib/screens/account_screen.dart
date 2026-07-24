import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/constants.dart';
import '../providers/auth_provider.dart';
import 'seller_dashboard_screen.dart';
import 'orders_screen.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('حسابي وإعدادات المتجر', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1F5EFF),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white24,
                    child: Text(
                      auth.userName.substring(0, 1),
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.userName, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(auth.userEmail, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Role Switcher Card (Shopper vs Seller)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('نوع الحساب المفتاح:', style: TextStyle(color: Colors.white60, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: auth.role == UserRole.shopper ? const Color(0xFF1F5EFF) : Colors.white12,
                            ),
                            backgroundColor: auth.role == UserRole.shopper ? const Color(0xFF1F5EFF).withOpacity(0.15) : null,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            auth.setRole(UserRole.shopper);
                          },
                          child: const Text('🛒 متسوق', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: auth.role == UserRole.seller ? const Color(0xFF10B981) : Colors.white12,
                            ),
                            backgroundColor: auth.role == UserRole.seller ? const Color(0xFF10B981).withOpacity(0.15) : null,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            auth.setRole(UserRole.seller);
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const SellerDashboardScreen()),
                            );
                          },
                          child: const Text('🏪 بائع', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Account Options Menu
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF38BDF8)),
                    title: const Text('طلباتي ومتابعة الشحن', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    trailing: const Icon(Icons.chevron_left, color: Colors.white38),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const OrdersScreen()),
                      );
                    },
                  ),
                  const Divider(color: Colors.white12, height: 1),
                  ListTile(
                    leading: const Icon(Icons.storefront_outlined, color: Color(0xFF10B981)),
                    title: const Text('لوحة البائع وإدارة المتجر', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: const Text('إضافة منتجات من الكاميرا ومتابعة المبيعات', style: TextStyle(color: Colors.white38, fontSize: 10)),
                    trailing: const Icon(Icons.chevron_left, color: Colors.white38),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const SellerDashboardScreen()),
                      );
                    },
                  ),
                  const Divider(color: Colors.white12, height: 1),
                  ListTile(
                    leading: const Icon(Icons.chat_outlined, color: Colors.greenAccent),
                    title: const Text('الدعم الفني عبر واتساب', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    trailing: const Icon(Icons.chevron_left, color: Colors.white38),
                    onTap: () async {
                      final url = Uri.parse('https://wa.me/${AppConstants.whatsappPhone}');
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
