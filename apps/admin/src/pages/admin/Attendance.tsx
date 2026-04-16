import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const Attendance = () => {
  const { user, vehicles, students, drivers } = useAuth();
  const schoolVehicles = vehicles.filter(v => v.schoolId === user?.schoolId);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const vehicle = vehicles.find(v => v.id === selectedVehicle);
  const assignedStudents = vehicle ? students.filter(s => vehicle.assignedStudentIds.includes(s.id)) : [];

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const downloadPDF = () => {
    toast.success("Attendance report downloaded (demo)");
  };

  const downloadAll = () => {
    toast.success("All vehicle reports downloaded (demo)");
  };

  if (selectedVehicle && vehicle) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => setSelectedVehicle(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Vehicles
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">{vehicle.type} — {vehicle.vehicleNumber}</h1>
          <p className="text-muted-foreground">Attendance for today</p>
        </div>
        {assignedStudents.length === 0 ? (
          <p className="text-muted-foreground">No students assigned to this vehicle.</p>
        ) : (
          <div className="space-y-2">
            {assignedStudents.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/50">
                <Checkbox checked={attendance[s.id] ?? true} onCheckedChange={() => toggleAttendance(s.id)} />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Class {s.class}-{s.section}</p>
                </div>
                <span className={`ml-auto text-xs font-medium ${(attendance[s.id] ?? true) ? "text-success" : "text-destructive"}`}>
                  {(attendance[s.id] ?? true) ? "Present" : "Absent"}
                </span>
              </label>
            ))}
          </div>
        )}
        <Button onClick={downloadPDF} className="gap-2"><Download className="w-4 h-4" /> Download Report</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance & Reports</h1>
          <p className="text-muted-foreground">Select a vehicle to view attendance</p>
        </div>
        <Button onClick={downloadAll} disabled={selectedVehicles.length === 0} className="gap-2">
          <Download className="w-4 h-4" /> Download Report ({selectedVehicles.length})
        </Button>
      </div>

      {schoolVehicles.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No vehicles found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {schoolVehicles.map(v => {
            const driver = drivers.find(d => d.id === v.assignedDriverId);
            return (
              <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedVehicle(v.id)}>
                <CardContent className="py-4 flex items-center gap-3">
                  <Checkbox
                    checked={selectedVehicles.includes(v.id)}
                    onCheckedChange={checked => {
                      setSelectedVehicles(prev => checked ? [...prev, v.id] : prev.filter(i => i !== v.id));
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <p className="font-medium capitalize">{v.type} — {v.vehicleNumber}</p>
                    <p className="text-sm text-muted-foreground">Driver: {driver?.name || "None"} · Students: {v.assignedStudentIds.length}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Attendance;
