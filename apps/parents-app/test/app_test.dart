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
    expect(find.text('Backend Login'), findsOneWidget);
  });

  test('role capability map matches parent-only access rules', () {
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.currentTrip), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.leaveRequests), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.notificationsFeed), isTrue);
    expect(RoleApiAccess.canAccess(AppRole.parent, AppApiEndpoint.profile), isTrue);
  });
}
