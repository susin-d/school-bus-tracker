import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import RealTimeMapView from "@/components/RealTimeMapView";

const ActiveTrips = () => {
  const { user, vehicles, drivers } = useAuth();
  const schoolVehicles = vehicles.filter(v => v.schoolId === user?.schoolId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Active Trips</h1>
        <p className="text-muted-foreground">Real-time map view of running buses</p>
      </div>

      {/* Real-Time Map View */}
      <RealTimeMapView height="h-[500px]" />

      <h2 className="text-lg font-display font-semibold">Vehicle Status</h2>
      {schoolVehicles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No vehicles registered yet.</p>
      ) : (
        <div className="grid gap-3">
          {schoolVehicles.map(v => {
            const driver = drivers.find(d => d.id === v.assignedDriverId);
            return (
              <Card key={v.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{v.type} — {v.vehicleNumber}</p>
                    <p className="text-sm text-muted-foreground">Driver: {driver?.name || "Unassigned"} · Students: {v.assignedStudentIds.length}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">Idle</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveTrips;
