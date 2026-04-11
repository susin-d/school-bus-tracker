import { useEffect } from "react";

import { useAdminSession } from "./core/auth";
import { canAccessRoute } from "./core/roleAccess";
import { useAdminRouter } from "./core/router";
import { AlertsPage } from "./features/alerts/AlertsPage";
import { AssignmentsPage } from "./features/assignments/AssignmentsPage";
import { AdminAuthScreen } from "./features/auth/AdminAuthScreen";
import { AdminLandingPage } from "./features/auth/AdminLandingPage";
import { BusesPage } from "./features/buses/BusesPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DriversPage } from "./features/drivers/DriversPage";
import { LeaveRequestsPage } from "./features/leaveRequests/LeaveRequestsPage";
import { MailPage } from "./features/mail/MailPage";
import { LiveMapPage } from "./features/maps/LiveMapPage";
import { RoutesPage } from "./features/routes/RoutesPage";
import { SchoolsPage } from "./features/schools/SchoolsPage";
import { StopsPage } from "./features/stops/StopsPage";
import { StudentsPage } from "./features/students/StudentsPage";
import { UsersPage } from "./features/users/UsersPage";

export function AdminApp() {
  const { currentUser } = useAdminSession();
  const { currentRoute, navigate } = useAdminRouter();
  const canAccessCurrentRoute = currentUser
    ? canAccessRoute(currentUser.role, currentRoute)
    : false;

  useEffect(() => {
    if (currentUser && !canAccessCurrentRoute) {
      navigate("dashboard");
    }
  }, [canAccessCurrentRoute, currentUser, navigate]);

  if (currentRoute === "landing") {
    return <AdminLandingPage />;
  }

  if (currentRoute === "login") {
    return <AdminAuthScreen />;
  }

  if (!currentUser) {
    return <AdminAuthScreen />;
  }

  if (!canAccessCurrentRoute) {
    return <DashboardPage />;
  }

  switch (currentRoute) {
    case "liveMap":
      return <LiveMapPage />;
    case "schools":
      return <SchoolsPage />;
    case "users":
      return <UsersPage />;
    case "students":
      return <StudentsPage />;
    case "routes":
      return <RoutesPage />;
    case "stops":
      return <StopsPage />;
    case "buses":
      return <BusesPage />;
    case "drivers":
      return <DriversPage />;
    case "assignments":
      return <AssignmentsPage />;
    case "mail":
      return <MailPage />;
    case "alerts":
      return <AlertsPage />;
    case "leaveRequests":
      return <LeaveRequestsPage />;
    case "dashboard":
    default:
      return <DashboardPage />;
  }
}
