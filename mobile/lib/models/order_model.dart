class OrderModel {
  final String id;
  final String orderNumber;
  final double total;
  final String status;
  final String paymentStatus;
  final String createdAt;
  final int itemsCount;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.total,
    required this.status,
    required this.paymentStatus,
    required this.createdAt,
    required this.itemsCount,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? 'ORD-000',
      total: (json['total'] != null) ? (json['total'] as num).toDouble() : 0.0,
      status: json['status']?.toString() ?? 'pending',
      paymentStatus: json['payment_status']?.toString() ?? 'unpaid',
      createdAt: json['created_at']?.toString() ?? DateTime.now().toIso8601String(),
      itemsCount: (json['items_count'] != null) ? (json['items_count'] as num).toInt() : 1,
    );
  }

  String get statusLabelAr {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'confirmed':
        return 'تم التأكيد';
      case 'processing':
        return 'قيد التجهيز';
      case 'shipped':
        return 'تم الشحن 🚚';
      case 'delivered':
        return 'تم التسليم 🎉';
      case 'cancelled':
        return 'ملغي';
      default:
        return 'نشط';
    }
  }
}
