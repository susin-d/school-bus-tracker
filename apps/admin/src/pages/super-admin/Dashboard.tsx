import { useAuth } from "@/contexts/AuthContext";
import { School, Users, Bus, MapPin, BarChart3, ShieldCheck } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <div className="stat-card flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const { schools, students, drivers, vehicles } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">System-wide statistics and monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={School} label="Total Schools" value={schools.length} color="bg-primary/10 text-primary" />
        <StatCard icon={ShieldCheck} label="Total Admins" value={schools.length} color="bg-accent/10 text-accent" />
        <StatCard icon={Bus} label="Total Buses" value={vehicles.length} color="bg-warning/10 text-warning" />
        <StatCard icon={Users} label="Total Students" value={students.length} color="bg-success/10 text-success" />
        <StatCard icon={MapPin} label="Active Trips" value={0} color="bg-destructive/10 text-destructive" />
        <StatCard icon={BarChart3} label="Total Drivers" value={drivers.length} color="bg-primary/10 text-primary" />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
