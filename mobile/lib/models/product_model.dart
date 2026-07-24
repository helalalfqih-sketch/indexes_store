class ProductModel {
  final String id;
  final String slug;
  final String name;
  final String? description;
  final double price;
  final double? oldPrice;
  final String image;
  final List<String> images;
  final String? videoPlaybackId;
  final String? categoryId;
  final String? categoryName;
  final String? brand;
  final double rating;
  final int reviews;
  final int stock;
  final String? badge;

  ProductModel({
    required this.id,
    required this.slug,
    required this.name,
    this.description,
    required this.price,
    this.oldPrice,
    required this.image,
    this.images = const [],
    this.videoPlaybackId,
    this.categoryId,
    this.categoryName,
    this.brand,
    this.rating = 4.8,
    this.reviews = 32,
    this.stock = 10,
    this.badge,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedImages = [];
    if (json['images'] != null && json['images'] is List) {
      parsedImages = (json['images'] as List).map((e) => e.toString()).toList();
    }

    final double pPrice = (json['price'] != null) ? (json['price'] as num).toDouble() : 0.0;
    final double? pOldPrice = (json['old_price'] ?? json['oldPrice']) != null
        ? (json['old_price'] ?? json['oldPrice'] as num).toDouble()
        : null;

    return ProductModel(
      id: json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'منتج فاخر',
      description: json['description']?.toString(),
      price: pPrice,
      oldPrice: pOldPrice,
      image: json['image']?.toString() ??
          (parsedImages.isNotEmpty ? parsedImages.first : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'),
      images: parsedImages,
      videoPlaybackId: json['video_playback_id'] ?? json['videoPlaybackId'],
      categoryId: json['category_id']?.toString() ?? json['categoryId']?.toString(),
      categoryName: json['category_name']?.toString(),
      brand: json['brand']?.toString(),
      rating: (json['rating'] != null) ? (json['rating'] as num).toDouble() : 4.8,
      reviews: (json['reviews'] != null) ? (json['reviews'] as num).toInt() : 32,
      stock: (json['stock'] != null) ? (json['stock'] as num).toInt() : 10,
      badge: json['badge']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'slug': slug,
      'name': name,
      'description': description,
      'price': price,
      'old_price': oldPrice,
      'image': image,
      'images': images,
      'video_playback_id': videoPlaybackId,
      'category_id': categoryId,
      'brand': brand,
      'rating': rating,
      'reviews': reviews,
      'stock': stock,
      'badge': badge,
    };
  }
}
