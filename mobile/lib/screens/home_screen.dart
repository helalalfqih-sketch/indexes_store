import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../models/product_model.dart';
import '../models/category_model.dart';
import '../providers/cart_provider.dart';
import '../services/supabase_service.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<ProductModel> _products = [];
  List<CategoryModel> _categories = [];
  bool _isLoading = true;
  String _selectedCatId = 'all';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final cats = await SupabaseService.instance.getCategories();
    final prods = await SupabaseService.instance.getProducts(categoryId: _selectedCatId);

    if (mounted) {
      setState(() {
        _categories = cats;
        _products = prods;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: const Color(0xFF38BDF8),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Logo + App Name + Announcement
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1F5EFF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text(
                          'NOQTA',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          AppConstants.appNameAr,
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18),
                        ),
                        Text(
                          'Premium Native Store 🇾🇪',
                          style: TextStyle(color: Color(0xFF38BDF8), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Hero Promo Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1F5EFF), Color(0xFF0F172A)],
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1F5EFF).withValues(alpha: 0.3),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'عروض حصرية ⚡',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'شحن مجاني للطلبات فوق 50,000 ريال',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'تصفح أحدث الأجهزة الذكية والساعات الفاخرة مع خدمة التوصيل بكافة المحافظات.',
                        style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Categories Bar
                const Text(
                  'التصنيفات الرئيسية',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        final isSelected = _selectedCatId == 'all';
                        return Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: ChoiceChip(
                            label: const Text('الكل'),
                            selected: isSelected,
                            selectedColor: const Color(0xFF1F5EFF),
                            backgroundColor: const Color(0xFF0F172A),
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : Colors.white60,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                            onSelected: (_) {
                              setState(() => _selectedCatId = 'all');
                              _loadData();
                            },
                          ),
                        );
                      }
                      final cat = _categories[index - 1];
                      final isSelected = _selectedCatId == cat.id;
                      return Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: ChoiceChip(
                          label: Text('${cat.icon ?? "📦"} ${cat.name}'),
                          selected: isSelected,
                          selectedColor: const Color(0xFF1F5EFF),
                          backgroundColor: const Color(0xFF0F172A),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : Colors.white60,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (_) {
                            setState(() => _selectedCatId = cat.id);
                            _loadData();
                          },
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),

                // Products Section Title
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text(
                      'أبرز المنتجات الفاخرة',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'عرض الكل',
                      style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Products Grid
                _isLoading
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
                        ),
                      )
                    : _products.isEmpty
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Center(
                              child: Text(
                                'لا توجد منتجات في هذا التصنيف حالياً',
                                style: TextStyle(color: Colors.white60, fontSize: 13),
                              ),
                            ),
                          )
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.68,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                            ),
                            itemCount: _products.length,
                            itemBuilder: (context, index) {
                              final product = _products[index];
                              return _buildProductCard(context, product);
                            },
                          ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, ProductModel product) {
    final cart = Provider.of<CartProvider>(context, listen: false);

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: product),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image Thumbnail
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: CachedNetworkImage(
                      imageUrl: product.image,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: Colors.black26),
                      errorWidget: (context, url, error) => Container(
                        color: Colors.black38,
                        child: const Icon(Icons.image, color: Colors.white38),
                      ),
                    ),
                  ),
                  if (product.badge != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.purple.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          product.badge!,
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Product Details
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Price
                  Row(
                    children: [
                      Text(
                        '${product.price.toInt()} ريال',
                        style: const TextStyle(
                          color: Color(0xFF38BDF8),
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      if (product.oldPrice != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          '${product.oldPrice!.toInt()}',
                          style: const TextStyle(
                            color: Colors.white38,
                            fontSize: 10,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Add to Cart Button
                  SizedBox(
                    width: double.infinity,
                    height: 32,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1F5EFF),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: EdgeInsets.zero,
                      ),
                      onPressed: () {
                        cart.addToCart(product);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('تمت إضافة "${product.name}" إلى السلة 🛒'),
                            duration: const Duration(seconds: 1),
                          ),
                        );
                      },
                      child: const Text(
                        'إضافة للسلة 🛒',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
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
