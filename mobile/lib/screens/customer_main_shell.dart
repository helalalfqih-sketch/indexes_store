import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../services/deep_link_service.dart';
import 'home_screen.dart';
import 'categories_screen.dart';
import 'search_screen.dart';
import 'cart_screen.dart';
import 'account_screen.dart';

class CustomerMainShell extends StatefulWidget {
  const CustomerMainShell({super.key});

  @override
  State<CustomerMainShell> createState() => _CustomerMainShellState();
}

class _CustomerMainShellState extends State<CustomerMainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    CategoriesScreen(),
    SearchScreen(),
    CartScreen(),
    AccountScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      DeepLinkService.instance.init(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = Provider.of<CartProvider>(context).itemCount;

    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.08))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF38BDF8),
          unselectedItemColor: Colors.white54,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'الرئيسية',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_outlined),
              activeIcon: Icon(Icons.grid_view),
              label: 'التصنيفات',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.search_outlined),
              activeIcon: Icon(Icons.search),
              label: 'البحث',
            ),
            BottomNavigationBarItem(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.shopping_cart_outlined),
                  if (cartCount > 0)
                    Positioned(
                      right: -6,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$cartCount',
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
              activeIcon: const Icon(Icons.shopping_cart),
              label: 'السلة',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'حسابي',
            ),
          ],
        ),
      ),
    );
  }
}
