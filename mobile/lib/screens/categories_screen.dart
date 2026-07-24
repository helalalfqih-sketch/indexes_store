import 'package:flutter/material.dart';
import '../models/category_model.dart';
import '../models/product_model.dart';
import '../services/supabase_service.dart';
import 'product_detail_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<CategoryModel> _categories = [];
  List<ProductModel> _products = [];
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
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('التصنيفات والكتالوجات', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        elevation: 0,
      ),
      body: Row(
        children: [
          // Left Sidebar Categories List
          Container(
            width: 110,
            color: const Color(0xFF0F172A),
            child: ListView.builder(
              itemCount: _categories.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  final isSelected = _selectedCatId == 'all';
                  return ListTile(
                    selected: isSelected,
                    selectedTileColor: const Color(0xFF1F5EFF).withOpacity(0.2),
                    title: const Text('جميع المنتجات', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    onTap: () {
                      setState(() => _selectedCatId = 'all');
                      _loadData();
                    },
                  );
                }
                final cat = _categories[index - 1];
                final isSelected = _selectedCatId == cat.id;
                return ListTile(
                  selected: isSelected,
                  selectedTileColor: const Color(0xFF1F5EFF).withOpacity(0.2),
                  title: Text('${cat.icon ?? "📦"} ${cat.name}', style: TextStyle(color: isSelected ? const Color(0xFF38BDF8) : Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                  onTap: () {
                    setState(() => _selectedCatId = cat.id);
                    _loadData();
                  },
                );
              },
            ),
          ),

          // Right Products Grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : Padding(
                    padding: const EdgeInsets.all(12),
                    child: GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.72,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _products.length,
                      itemBuilder: (context, index) {
                        final p = _products[index];
                        return GestureDetector(
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
                            );
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                    child: Image.network(
                                      p.image,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.image, color: Colors.white38),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(8),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text('${p.price.toInt()} ريال', style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
