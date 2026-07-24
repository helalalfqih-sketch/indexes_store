import 'package:flutter_test/flutter_test.dart';
import 'package:indexes_store_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const IndexesStoreApp());
  });
}
