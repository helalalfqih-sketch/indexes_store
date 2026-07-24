import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import '../screens/product_detail_screen.dart';
import '../services/supabase_service.dart';

class DeepLinkService {
  static final DeepLinkService instance = DeepLinkService._internal();
  DeepLinkService._internal();

  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;

  void init(BuildContext context) {
    // Handle initial uri when app starts from cold link
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) {
        _handleDeepLink(context, uri);
      }
    });

    // Handle background / foreground links while app is open
    _sub = _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(context, uri);
    });
  }

  void _handleDeepLink(BuildContext context, Uri uri) async {
    print('Incoming Deep Link: $uri');
    final pathSegments = uri.pathSegments;

    // Check pattern: /product/{slug}
    if (pathSegments.length >= 2 && pathSegments[0] == 'product') {
      final slug = pathSegments[1];
      
      // Fetch matching product
      final products = await SupabaseService.instance.getProducts();
      final matched = products.firstWhere(
        (p) => p.slug == slug || p.id == slug,
        orElse: () => products.first,
      );

      if (context.mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: matched),
          ),
        );
      }
    }
  }

  void dispose() {
    _sub?.cancel();
  }
}
