import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import 'config/constants.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'services/notification_service.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase Flutter SDK
  try {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      // ignore: deprecated_member_use
      anonKey: AppConstants.supabaseAnonKey,
    );
  } catch (e) {
    debugPrint('Supabase init warning: $e');
  }

  // Initialize FCM Push Notification Service
  await NotificationService.instance.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const IndexesStoreApp(),
    ),
  );
}

class IndexesStoreApp extends StatelessWidget {
  const IndexesStoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appNameAr,
      debugShowCheckedModeBanner: false,

      // RTL Arabic Support
      locale: const Locale('ar', 'YE'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('ar', 'YE'),
        Locale('en', 'US'),
      ],

      // Store Luxury Theme
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF06091F),
        primaryColor: const Color(0xFF1F5EFF),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF1F5EFF),
          secondary: Color(0xFF38BDF8),
          surface: Color(0xFF0F172A),
        ),
        textTheme: GoogleFonts.tajawalTextTheme(
          ThemeData.dark().textTheme,
        ),
      ),

      home: const SplashScreen(),
    );
  }
}
