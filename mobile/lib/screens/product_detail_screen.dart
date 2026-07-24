import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/constants.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;

  void _launchWhatsAppOrder() async {
    final origin = 'https://${AppConstants.domain}';
    final productUrl = '$origin/product/${widget.product.slug}';
    final message = 'السلام عليكم،\nأريد طلب:\n${widget.product.name}\n\nالسعر:\n${widget.product.price.toInt()} ريال يمني\n\nالرابط:\n$productUrl';
    
    final url = Uri.parse('https://wa.me/${AppConstants.whatsappPhone}?text=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final cart = Provider.of<CartProvider>(context, listen: false);

    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: Text(product.name, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Media Image Viewer
            Container(
              height: 300,
              width: double.infinity,
              color: Colors.black,
              child: CachedNetworkImage(
                imageUrl: product.image,
                fit: BoxFit.contain,
                placeholder: (_, __) => const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8))),
                errorWidget: (_, __, ___) => const Icon(Icons.image, size: 60, color: Colors.white38),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category Tag
                  if (product.categoryName != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1F5EFF).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        product.categoryName!,
                        style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),

                  const SizedBox(height: 12),

                  // Title
                  Text(
                    product.name,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, height: 1.3),
                  ),

                  const SizedBox(height: 12),

                  // Price & Old Price
                  Row(
                    children: [
                      Text(
                        '${product.price.toInt()} ريال يمني',
                        style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 22, fontWeight: FontWeight.w900),
                      ),
                      if (product.oldPrice != null) ...[
                        const SizedBox(width: 12),
                        Text(
                          '${product.oldPrice!.toInt()} ريال',
                          style: const TextStyle(color: Colors.white38, fontSize: 14, decoration: TextDecoration.lineThrough),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 16),
                  const Divider(color: Colors.white12),

                  // Description
                  const Text('تفاصيل المنتج:', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    product.description ?? 'منتج فاخر مع ضمان وجودة عالية للتوصيل لكافة المحافظات.',
                    style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.6),
                  ),

                  const SizedBox(height: 24),

                  // Quantity Selector
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('الكمية:', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline, color: Colors.white70),
                            onPressed: () {
                              if (_quantity > 1) setState(() => _quantity--);
                            },
                          ),
                          Text('$_quantity', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline, color: Color(0xFF38BDF8)),
                            onPressed: () {
                              setState(() => _quantity++);
                            },
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Action Buttons: WhatsApp & Add to Cart
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _launchWhatsAppOrder,
                      icon: const Icon(Icons.chat_bubble_outline, color: Colors.white),
                      label: const Text('اطلب فوراً عبر واتساب', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    ),
                  ),

                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF1F5EFF)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () {
                        cart.addToCart(product, quantity: _quantity);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('تمت إضافة "$_quantity × ${product.name}" إلى السلة 🛒')),
                        );
                      },
                      icon: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF38BDF8)),
                      label: const Text('إضافة إلى السلة', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 14, fontWeight: FontWeight.bold)),
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
