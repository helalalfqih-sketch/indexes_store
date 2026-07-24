import 'package:flutter/material.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._internal();
  NotificationService._internal();

  Future<void> initialize() async {
    debugPrint('Notification Service initialized for FCM Push Notifications');
  }

  /// Show In-App Push Notification Banner
  void showOrderNotification(BuildContext context, {required String title, required String body}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: const Color(0xFF0F172A),
        content: Row(
          children: [
            const Icon(Icons.notifications_active, color: Color(0xFF38BDF8)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    body,
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
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
