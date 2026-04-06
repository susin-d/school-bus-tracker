import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:schoolbus_bridge_mobile/app.dart';
import 'package:schoolbus_bridge_mobile/core/api_access.dart';

void main() {
  testWidgets('renders login flow', (tester) async {
    await tester.binding.setSurfaceSize(const Size(900, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const SchoolBusApp());

    expect(find.text('Login'), findsOneWidget);
    expect(find.text('Phone OTP'), findsOneWidget);
    expect(find.text('Dev Login'), findsOneWidget);
  });

  testWidgets('navigates to parent home after sign in', (tester) async {
    await tester.binding.setSurfaceSize(const Size(900, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const SchoolBusApp());

    await tester.enterText(find.byType(TextField).at(2), 'Asha');
    await tester.tap(find.byKey(const Key('continue_button')));
    await tester.pumpAndSettle();

    expect(find.text('Parent Home'), findsOneWidget);
    expect(find.text('Welcome, Asha'), findsOneWidget);
  });

  test('role capability map matches backend access rules', () {
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.currentTrip), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.leaveRequests), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.notificationsFeed), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.profile), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.tripStart), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.attendanceBoard), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.delayAlert), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.driver, AppApiEndpoint.leaveRequests), isFalse);
  });

  testWidgets('parent screen shows only parent-safe endpoint guidance', (tester) async {
    await tester.binding.setSurfaceSize(const Size(900, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const SchoolBusApp());

    await tester.tap(find.byKey(const Key('continue_button')));
    await tester.pumpAndSettle();

    expect(find.text('Parent Home'), findsOneWidget);
    expect(find.text('Current Trip'), findsOneWidget);
  });
}
