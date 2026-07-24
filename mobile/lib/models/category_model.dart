class CategoryModel {
  final String id;
  final String slug;
  final String name;
  final String? icon;
  final String? image;

  CategoryModel({
    required this.id,
    required this.slug,
    required this.name,
    this.icon,
    this.image,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'تصنيف',
      icon: json['icon']?.toString(),
      image: json['image']?.toString(),
    );
  }
}
