import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bus, Users, MapPin, UserCog } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color, onClick }: { icon: React.ElementType; label: string; value: string | number; color: string; onClick?: () => void }) => (
  <button onClick={onClick} className="stat-card flex items-start gap-4 text-left w-full">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </button>
);

const AdminDashboard = () => {
  const { user, students, drivers, vehicles } = useAuth();
  const navigate = useNavigate();
  const schoolStudents = students.filter(s => s.schoolId === user?.schoolId);
  const schoolDrivers = drivers.filter(d => d.schoolId === user?.schoolId);
  const schoolVehicles = vehicles.filter(v => v.schoolId === user?.schoolId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{user?.schoolName} — Transport Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bus} label="Total Buses" value={schoolVehicles.length} color="bg-primary/10 text-primary" onClick={() => navigate("/admin/vehicles")} />
        <StatCard icon={Users} label="Total Students" value={schoolStudents.length} color="bg-success/10 text-success" onClick={() => navigate("/admin/students")} />
        <StatCard icon={MapPin} label="Active Trips" value={0} color="bg-warning/10 text-warning" onClick={() => navigate("/admin/active-trips")} />
        <StatCard icon={UserCog} label="Total Drivers" value={schoolDrivers.length} color="bg-accent/10 text-accent" onClick={() => navigate("/admin/drivers")} />
      </div>
    </div>
  );
};

export default AdminDashboard;
