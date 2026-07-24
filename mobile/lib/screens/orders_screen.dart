import 'package:flutter/material.dart';
import '../models/order_model.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Simulated Orders List for Customer Tracking
    final orders = [
      OrderModel(
        id: 'ord-1',
        orderNumber: 'ORD-783921',
        total: 18500.0,
        status: 'shipped',
        paymentStatus: 'cod',
        createdAt: DateTime.now().subtract(const Duration(hours: 4)).toIso8601String(),
        itemsCount: 1,
      ),
      OrderModel(
        id: 'ord-2',
        orderNumber: 'ORD-610283',
        total: 26500.0,
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        itemsCount: 2,
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('متابعة وسجل الطلبات', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        elevation: 0,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final ord = orders[index];
          return Card(
            color: const Color(0xFF0F172A),
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(ord.orderNumber, style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 14)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: ord.status == 'delivered' ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          ord.statusLabelAr,
                          style: TextStyle(
                            color: ord.status == 'delivered' ? Colors.greenAccent : Colors.orangeAccent,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('الإجمالي: ${ord.total.toInt()} ريال — ${ord.itemsCount} منتج', style: const TextStyle(color: Colors.white, fontSize: 13)),
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white12),

                  // Order Timeline
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStep('تم الطلب', true),
                      _buildStep('التأكيد', true),
                      _buildStep('الشحن 🚚', ord.status == 'shipped' || ord.status == 'delivered'),
                      _buildStep('التسليم 🎉', ord.status == 'delivered'),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStep(String label, bool isDone) {
    return Column(
      children: [
        Icon(
          isDone ? Icons.check_circle : Icons.circle_outlined,
          color: isDone ? const Color(0xFF10B981) : Colors.white24,
          size: 18,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: isDone ? Colors.white : Colors.white38,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
