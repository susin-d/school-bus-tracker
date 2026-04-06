import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:schoolbus_bridge_driver/app.dart';
import 'package:schoolbus_bridge_driver/core/api_access.dart';

void main() {
  testWidgets('renders driver login flow', (tester) async {
    await tester.binding.setSurfaceSize(const Size(900, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const SchoolBusApp());

    expect(find.text('Login'), findsOneWidget);
    expect(find.text('SchoolBus Driver'), findsOneWidget);
    expect(find.text('Dev Login'), findsOneWidget);
  });

  testWidgets('navigates to driver home after dev sign in', (tester) async {
    await tester.binding.setSurfaceSize(const Size(900, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const SchoolBusApp());

    await tester.enterText(find.byType(TextField).at(4), 'Driver Dinesh');
    await tester.tap(find.byKey(const Key('continue_button')));
    await tester.pumpAndSettle();

    expect(find.text('Driver Home'), findsOneWidget);
    expect(find.text('Welcome, Driver Dinesh'), findsOneWidget);
  });

  test('driver capability map contains only driver-safe endpoints', () {
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.tripStart), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.attendanceBoard), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.delayAlert), isTrue);
    expect(RoleApiAccess.allowedEndpoints(AppRole.driver).contains(AppApiEndpoint.profile), isTrue);
  });
}
