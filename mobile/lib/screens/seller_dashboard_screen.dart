import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/supabase_service.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({super.key});

  @override
  State<SellerDashboardScreen> createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  final _titleController = TextEditingController();
  final _priceController = TextEditingController();
  final _descController = TextEditingController();
  File? _selectedImage;
  bool _isUploading = false;

  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(source: source);
      if (picked != null) {
        setState(() {
          _selectedImage = File(picked.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل اختيار الصورة: $e')),
        );
      }
    }
  }

  Future<void> _createProduct() async {
    if (_titleController.text.trim().isEmpty || _priceController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء إدخال اسم المنتج والسعر')),
      );
      return;
    }

    setState(() => _isUploading = true);

    String? imageUrl;
    if (_selectedImage != null) {
      imageUrl = await SupabaseService.instance.uploadSellerMedia(_selectedImage!);
    }

    setState(() => _isUploading = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تم إضافة المنتج بنجاح! ${imageUrl != null ? "وتم رفع الصورة إلى Supabase Storage 📸" : ""}'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      _titleController.clear();
      _priceController.clear();
      _descController.clear();
      setState(() => _selectedImage = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06091F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('لوحة البائع والمنتجات 🏪', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats Row
            Row(
              children: [
                _buildStatCard('إجمالي المبيعات', '295,000 ريال', const Color(0xFF10B981)),
                const SizedBox(width: 12),
                _buildStatCard('الطلبات الجديدة', '12 طلب', const Color(0xFF38BDF8)),
              ],
            ),

            const SizedBox(height: 24),

            // Create Product Form
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('إضافة منتج جديد للمتجر:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 16),

                  // Image Picker Section
                  GestureDetector(
                    onTap: () {
                      _showImagePickerModal();
                    },
                    child: Container(
                      height: 160,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.4), style: BorderStyle.solid),
                      ),
                      child: _selectedImage != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Image.file(_selectedImage!, fit: BoxFit.cover),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.camera_alt_outlined, color: Color(0xFF38BDF8), size: 36),
                                SizedBox(height: 8),
                                Text('التقط صورة بالكاميرا أو اختر من المعرض', style: TextStyle(color: Colors.white60, fontSize: 12)),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  TextField(
                    controller: _titleController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'اسم المنتج',
                      labelStyle: TextStyle(color: Colors.white60),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'السعر (بالريال اليمني)',
                      labelStyle: TextStyle(color: Colors.white60),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _descController,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'وصف المنتج والمواصفات',
                      labelStyle: TextStyle(color: Colors.white60),
                    ),
                  ),

                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _isUploading ? null : _createProduct,
                      child: _isUploading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('حفظ ونشر المنتج 🚀', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
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

  Widget _buildStatCard(String title, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  void _showImagePickerModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Color(0xFF38BDF8)),
              title: const Text('التقاط صورة بالكاميرا', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Color(0xFF10B981)),
              title: const Text('اختيار من المعرض (Gallery)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }
}
