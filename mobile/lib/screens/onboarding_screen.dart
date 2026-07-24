import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'customer_main_shell.dart';
import 'seller_dashboard_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  UserRole _selectedRole = UserRole.shopper;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // Header Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF1F5EFF).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF1F5EFF).withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'أهلاً بك في اندكس ستور 🇾🇪',
                  style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'اختر سياق حسابك للبدء',
                style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'يمكنك التسوق كمشتري أو إدارة وتأسيس متجرك الإلكتروني كبائع في أي وقت.',
                style: TextStyle(color: Colors.white60, fontSize: 13, height: 1.5),
              ),

              const SizedBox(height: 40),

              // Role Card 1: Shopper (متسوق)
              _buildRoleCard(
                role: UserRole.shopper,
                emoji: '🛒',
                title: 'أنا متسوق (Shopper)',
                subtitle: 'تصفح أحدث الأجهزة والمنتجات الفاخرة، الشراء المباشر، ومتابعة الطلبات.',
                color: const Color(0xFF1F5EFF),
              ),

              const SizedBox(height: 16),

              // Role Card 2: Seller (بائع)
              _buildRoleCard(
                role: UserRole.seller,
                emoji: '🏪',
                title: 'أنا بائع (Seller)',
                subtitle: 'إنشاء متجر، إضافة المنتجات من الكاميرا، وإدارة المبيعات والطلبات.',
                color: const Color(0xFF10B981),
              ),

              const Spacer(),

              // Continue Action Button
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _selectedRole == UserRole.shopper
                        ? const Color(0xFF1F5EFF)
                        : const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 4,
                  ),
                  onPressed: () {
                    final authProvider = Provider.of<AuthProvider>(context, listen: false);
                    authProvider.setRole(_selectedRole);

                    if (_selectedRole == UserRole.seller) {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const SellerDashboardScreen()),
                      );
                    } else {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const CustomerMainShell()),
                      );
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _selectedRole == UserRole.shopper
                            ? 'الانتقال لمتجر التسوق ➔'
                            : 'الانتقال للوحة البائع ➔',
                        style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required UserRole role,
    required String emoji,
    required String title,
    required String subtitle,
    required Color color,
  }) {
    final isSelected = _selectedRole == role;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedRole = role;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.15) : const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? color : Colors.white12,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: color.withValues(alpha: 0.25), blurRadius: 15, spreadRadius: 1)]
              : [],
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Colors.white60, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: color, size: 24)
            else
              const Icon(Icons.circle_outlined, color: Colors.white24, size: 24),
          ],
        ),
      ),
    );
  }
}
