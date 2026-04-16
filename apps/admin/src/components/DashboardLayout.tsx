import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Bus, LogOut, Bell, ChevronLeft, ChevronRight, LayoutDashboard,
  School, Users, UserCog, Truck, ClipboardList, Megaphone,
  MapPin, BarChart3, Settings, Shield, Database, Palette, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const superAdminMenu: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/super-admin" },
  { label: "Admin Management", icon: UserCog, path: "/super-admin/admins" },
  { label: "Manage Schools", icon: School, path: "/super-admin/schools" },
  { label: "Global Monitoring", icon: MapPin, path: "/super-admin/monitoring" },
  { label: "System Analytics", icon: BarChart3, path: "/super-admin/analytics" },
  { label: "Announcements", icon: Megaphone, path: "/super-admin/announcements" },
  { label: "Roles & Permissions", icon: Shield, path: "/super-admin/roles" },
  { label: "App Configuration", icon: Settings, path: "/super-admin/config" },
  { label: "Data Management", icon: Database, path: "/super-admin/data" },
  { label: "Security Settings", icon: Lock, path: "/super-admin/security" },
  { label: "Change Password", icon: Lock, path: "/super-admin/password" },
  { label: "Theme Settings", icon: Palette, path: "/super-admin/theme" },
];

const adminMenu: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Active Trips", icon: MapPin, path: "/admin/active-trips" },
  { label: "Bus Tracking", icon: Bus, path: "/admin/bus-tracking" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Drivers", icon: UserCog, path: "/admin/drivers" },
  { label: "Vehicles", icon: Truck, path: "/admin/vehicles" },
  { label: "Attendance", icon: ClipboardList, path: "/admin/attendance" },
  { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  { label: "Change Password", icon: Lock, path: "/admin/password" },
  { label: "Theme Settings", icon: Palette, path: "/admin/theme" },
  { label: "Configuration", icon: Settings, path: "/admin/config" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menu = user?.role === "super_admin" ? superAdminMenu : adminMenu;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "h-screen sticky top-0 flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <Bus className="w-7 h-7 text-primary shrink-0" />
          {!collapsed && <span className="font-display font-bold text-lg text-foreground truncate">SURAKSHA</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {menu.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shrink-0">
          <div>
            <p className="text-sm text-muted-foreground">
              {user?.role === "super_admin" ? "Super Admin" : `Admin — ${user?.schoolName || ""}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
