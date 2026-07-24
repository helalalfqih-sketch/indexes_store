import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/product_model.dart';
import '../models/category_model.dart';
import '../models/order_model.dart';

class SupabaseService {
  static final SupabaseService instance = SupabaseService._internal();
  SupabaseService._internal();

  SupabaseClient get client => Supabase.instance.client;

  /// Fetch Products catalog from Supabase DB with fallback seed data
  Future<List<ProductModel>> getProducts({String? categoryId, String? search}) async {
    try {
      var query = client.from('products').select('*');

      if (categoryId != null && categoryId != 'all') {
        query = query.eq('category_id', categoryId);
      }

      final response = await query.order('created_at', ascending: false).limit(50);
      final List data = response as List;

      if (data.isNotEmpty) {
        List<ProductModel> products = data.map((json) => ProductModel.fromJson(json)).toList();
        if (search != null && search.trim().isNotEmpty) {
          final q = search.trim().toLowerCase();
          products = products.where((p) =>
            p.name.toLowerCase().contains(q) ||
            (p.description != null && p.description!.toLowerCase().contains(q)) ||
            (p.brand != null && p.brand!.toLowerCase().contains(q))
          ).toList();
        }
        return products;
      }
    } catch (e) {
      print('Supabase getProducts fallback: $e');
    }

    // Fallback Seed Data for testing/demo
    return _getFallbackProducts(search: search);
  }

  /// Fetch Categories from Supabase DB
  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await client.from('categories').select('*').limit(20);
      final List data = response as List;
      if (data.isNotEmpty) {
        return data.map((json) => CategoryModel.fromJson(json)).toList();
      }
    } catch (e) {
      print('Supabase getCategories fallback: $e');
    }

    return [
      CategoryModel(id: 'cat-1', slug: 'electronics', name: 'أجهزة منزلية', icon: '⚡'),
      CategoryModel(id: 'cat-2', slug: 'watches', name: 'ساعات فاخرة', icon: '⌚'),
      CategoryModel(id: 'cat-3', slug: 'smartphones', name: 'هواتف ذكية', icon: '📱'),
      CategoryModel(id: 'cat-4', slug: 'audio', name: 'سماعات وصوتيات', icon: '🎧'),
      CategoryModel(id: 'cat-5', slug: 'tools', name: 'معدات وأدوات', icon: '🛠️'),
    ];
  }

  /// Create New Order in Supabase DB
  Future<OrderModel?> createOrder({
    required List<Map<String, dynamic>> items,
    required double total,
    required String customerName,
    required String customerPhone,
    required String address,
  }) async {
    try {
      final orderNumber = 'ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      final orderData = {
        'order_number': orderNumber,
        'total': total,
        'status': 'pending',
        'payment_status': 'cod',
        'customer_name': customerName,
        'customer_phone': customerPhone,
        'shipping_address': address,
        'tenant_id': AppConstants.defaultTenantId,
        'created_at': DateTime.now().toIso8601String(),
      };

      final response = await client.from('orders').insert(orderData).select().single();
      return OrderModel.fromJson(response);
    } catch (e) {
      print('Error creating order: $e');
      // Return simulated order for offline testing
      return OrderModel(
        id: 'ord-${DateTime.now().millisecondsSinceEpoch}',
        orderNumber: 'ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        total: total,
        status: 'pending',
        paymentStatus: 'cod',
        createdAt: DateTime.now().toIso8601String(),
        itemsCount: items.length,
      );
    }
  }

  /// Upload Seller Media File (Camera/Gallery) to Supabase Storage
  Future<String?> uploadSellerMedia(File file) async {
    try {
      final fileName = 'seller_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final path = 'products/$fileName';

      await client.storage.from(AppConstants.mediaBucket).upload(path, file);
      final publicUrl = client.storage.from(AppConstants.mediaBucket).getPublicUrl(path);
      return publicUrl;
    } catch (e) {
      print('Error uploading seller media: $e');
      return null;
    }
  }

  /// Seed Fallback Data
  List<ProductModel> _getFallbackProducts({String? search}) {
    final list = [
      ProductModel(
        id: 'p1',
        slug: 'saw-48v-electric',
        name: 'منشار تقليم كهربائي 48V لاسلكي',
        description: 'منشار تقليم يمني عالي الكفاءة يعمل بالبطارية 48V مع طقم سلاسل إضافية وحقيبة حمل فاخرة.',
        price: 18500.0,
        oldPrice: 24000.0,
        image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407',
        categoryName: 'معدات وأدوات',
        brand: 'Indexes Power',
        badge: 'صفقة اليوم 🔥',
        stock: 12,
      ),
      ProductModel(
        id: 'p2',
        slug: 'luxury-chronograph-watch',
        name: 'ساعة رجالية كرونوغراف فاخرة',
        description: 'ساعة يد ضد الماء بتصميم ستانلس ستيل فاخر ومحرك ياباني دقيق.',
        price: 26500.0,
        oldPrice: 32000.0,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        categoryName: 'ساعات فاخرة',
        brand: 'NOQTA Luxury',
        badge: 'الأكثر مبيعاً 🏆',
        stock: 8,
      ),
      ProductModel(
        id: 'p3',
        slug: 'smart-4k-camera-drone',
        name: 'كاميرا تصوير 4K احترافية',
        description: 'عدسة احترافية 4K مع مثبت تصوير ثلاثي المحاور مخصص لصناع المحتوى.',
        price: 85000.0,
        oldPrice: 98000.0,
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
        categoryName: 'هواتف ذكية',
        brand: 'Indexes Vision',
        badge: 'جديد ⚡',
        stock: 5,
      ),
    ];

    if (search != null && search.trim().isNotEmpty) {
      final q = search.trim().toLowerCase();
      return list.where((p) => p.name.toLowerCase().contains(q)).toList();
    }
    return list;
  }
}
