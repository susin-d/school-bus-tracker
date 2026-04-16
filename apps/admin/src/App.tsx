import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import SuperAdminDashboard from "@/pages/super-admin/Dashboard";
import Schools from "@/pages/super-admin/Schools";
import SuperAdminAnnouncements from "@/pages/super-admin/Announcements";
import AdminManagement from "@/pages/super-admin/AdminManagement";
import GlobalMonitoring from "@/pages/super-admin/GlobalMonitoring";
import SystemAnalytics from "@/pages/super-admin/SystemAnalytics";
import RolesAndPermissions from "@/pages/super-admin/RolesAndPermissions";
import AppConfiguration from "@/pages/super-admin/AppConfiguration";
import DataManagement from "@/pages/super-admin/DataManagement";
import SecuritySettings from "@/pages/super-admin/SecuritySettings";
import ChangePassword from "@/pages/super-admin/ChangePassword";
import ThemeSettings from "@/pages/super-admin/ThemeSettings";
import Placeholder from "@/pages/super-admin/Placeholder";
import AdminDashboard from "@/pages/admin/Dashboard";
import Students from "@/pages/admin/Students";
import Drivers from "@/pages/admin/Drivers";
import Vehicles from "@/pages/admin/Vehicles";
import VehicleDetail from "@/pages/admin/VehicleDetail";
import Attendance from "@/pages/admin/Attendance";
import AdminAnnouncements from "@/pages/admin/Announcements";
import ActiveTrips from "@/pages/admin/ActiveTrips";
import AdminChangePassword from "@/pages/admin/ChangePassword";
import AdminThemeSettings from "@/pages/admin/ThemeSettings";
import BusTracking from "@/pages/admin/BusTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const LoginGate = () => {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "super_admin" ? "/super-admin" : "/admin"} replace />;
  return <Login />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginGate />} />

    {/* Super Admin */}
    <Route path="/super-admin" element={<ProtectedRoute role="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
    <Route path="/super-admin/schools" element={<ProtectedRoute role="super_admin"><Schools /></ProtectedRoute>} />
    <Route path="/super-admin/admins" element={<ProtectedRoute role="super_admin"><AdminManagement /></ProtectedRoute>} />
    <Route path="/super-admin/monitoring" element={<ProtectedRoute role="super_admin"><GlobalMonitoring /></ProtectedRoute>} />
    <Route path="/super-admin/analytics" element={<ProtectedRoute role="super_admin"><SystemAnalytics /></ProtectedRoute>} />
    <Route path="/super-admin/announcements" element={<ProtectedRoute role="super_admin"><SuperAdminAnnouncements /></ProtectedRoute>} />
    <Route path="/super-admin/roles" element={<ProtectedRoute role="super_admin"><RolesAndPermissions /></ProtectedRoute>} />
    <Route path="/super-admin/config" element={<ProtectedRoute role="super_admin"><AppConfiguration /></ProtectedRoute>} />
    <Route path="/super-admin/data" element={<ProtectedRoute role="super_admin"><DataManagement /></ProtectedRoute>} />
    <Route path="/super-admin/security" element={<ProtectedRoute role="super_admin"><SecuritySettings /></ProtectedRoute>} />
    <Route path="/super-admin/password" element={<ProtectedRoute role="super_admin"><ChangePassword /></ProtectedRoute>} />
    <Route path="/super-admin/theme" element={<ProtectedRoute role="super_admin"><ThemeSettings /></ProtectedRoute>} />

    {/* Admin */}
    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/active-trips" element={<ProtectedRoute role="admin"><ActiveTrips /></ProtectedRoute>} />
    <Route path="/admin/bus-tracking" element={<ProtectedRoute role="admin"><BusTracking /></ProtectedRoute>} />
    <Route path="/admin/students" element={<ProtectedRoute role="admin"><Students /></ProtectedRoute>} />
    <Route path="/admin/drivers" element={<ProtectedRoute role="admin"><Drivers /></ProtectedRoute>} />
    <Route path="/admin/vehicles" element={<ProtectedRoute role="admin"><Vehicles /></ProtectedRoute>} />
    <Route path="/admin/vehicles/:id" element={<ProtectedRoute role="admin"><VehicleDetail /></ProtectedRoute>} />
    <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><Attendance /></ProtectedRoute>} />
    <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><AdminAnnouncements /></ProtectedRoute>} />
    <Route path="/admin/password" element={<ProtectedRoute role="admin"><AdminChangePassword /></ProtectedRoute>} />
    <Route path="/admin/theme" element={<ProtectedRoute role="admin"><AdminThemeSettings /></ProtectedRoute>} />
    <Route path="/admin/config" element={<ProtectedRoute role="admin"><Placeholder title="Configuration" /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
