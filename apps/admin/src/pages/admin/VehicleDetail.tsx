import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Users, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, vehicles, updateVehicle, drivers, students } = useAuth();
  const vehicle = vehicles.find(v => v.id === id);
  const schoolDrivers = drivers.filter(d => d.schoolId === user?.schoolId);
  const schoolStudents = students.filter(s => s.schoolId === user?.schoolId);

  const [driverOpen, setDriverOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  if (!vehicle) return <div className="p-6">Vehicle not found. <Button variant="link" onClick={() => navigate("/admin/vehicles")}>Go back</Button></div>;

  const assignedDriver = drivers.find(d => d.id === vehicle.assignedDriverId);
  const assignedStudents = students.filter(s => vehicle.assignedStudentIds.includes(s.id));

  const filteredDrivers = schoolDrivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()));
  const filteredStudents = schoolStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
    const matchGrade = gradeFilter === "all" || s.class === gradeFilter;
    return matchSearch && matchGrade;
  });

  const uniqueGrades = [...new Set(schoolStudents.map(s => s.class))].sort();

  const assignDriver = async (driverId: string) => {
    try {
      await updateVehicle(vehicle.id, { assignedDriverId: driverId });
      setDriverOpen(false);
      toast.success("Driver assigned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign driver");
    }
  };

  const removeDriverAssignment = async () => {
    try {
      await updateVehicle(vehicle.id, { assignedDriverId: "" });
      toast.success("Driver removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove driver");
    }
  };

  const addStudents = async () => {
    const merged = [...new Set([...vehicle.assignedStudentIds, ...selectedStudents])];
    try {
      await updateVehicle(vehicle.id, { assignedStudentIds: merged });
      setSelectedStudents([]);
      setStudentOpen(false);
      toast.success("Students added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add students");
    }
  };

  const removeStudents = async () => {
    const remaining = vehicle.assignedStudentIds.filter(id => !selectedStudents.includes(id));
    try {
      await updateVehicle(vehicle.id, { assignedStudentIds: remaining });
      setSelectedStudents([]);
      toast.success("Students removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove students");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/admin/vehicles")} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Vehicles
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{vehicle.type} — {vehicle.vehicleNumber}</CardTitle>
          <p className="text-sm text-muted-foreground">Plate: {vehicle.numberPlate}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Driver Section */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
            <div>
              <p className="text-sm font-medium">Assigned Driver</p>
              <p className="text-sm text-muted-foreground">{assignedDriver ? `${assignedDriver.name} — ${assignedDriver.mobile}` : "No driver assigned"}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDriverOpen(true)} className="gap-1">
                <UserPlus className="w-4 h-4" /> {assignedDriver ? "Change" : "Add"} Driver
              </Button>
              {assignedDriver && (
                <Button size="sm" variant="outline" onClick={removeDriverAssignment} className="text-destructive gap-1">
                  <X className="w-4 h-4" /> Remove
                </Button>
              )}
            </div>
          </div>

          {/* Students Section */}
          <div className="flex items-center justify-between">
            <p className="font-medium">Assigned Students ({assignedStudents.length})</p>
            <Button size="sm" onClick={() => { setSelectedStudents([]); setStudentOpen(true); }} className="gap-1">
              <Users className="w-4 h-4" /> Add Students
            </Button>
          </div>

          {assignedStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No students assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignedStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Class {s.class}-{s.section} · Pickup: {s.pickupPoint}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    try {
                      await updateVehicle(vehicle.id, { assignedStudentIds: vehicle.assignedStudentIds.filter(i => i !== s.id) });
                      toast.success("Student removed");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to remove student");
                    }
                  }}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Dialog */}
      <Dialog open={driverOpen} onOpenChange={setDriverOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Driver</DialogTitle></DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search drivers..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)} />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredDrivers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No drivers found. Add drivers first.</p> : filteredDrivers.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.mobile}</p>
                </div>
                <Button size="sm" onClick={() => void assignDriver(d.id)}>Assign</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Add Students</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {uniqueGrades.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {filteredStudents.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No students found.</p> : filteredStudents.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={selectedStudents.includes(s.id)}
                  onCheckedChange={checked => {
                    setSelectedStudents(prev => checked ? [...prev, s.id] : prev.filter(i => i !== s.id));
                  }}
                />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Class {s.class}-{s.section}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button onClick={() => void addStudents()} disabled={selectedStudents.length === 0} className="flex-1">Add ({selectedStudents.length})</Button>
            <Button variant="outline" onClick={() => void removeStudents()} disabled={selectedStudents.length === 0} className="flex-1 text-destructive">Remove ({selectedStudents.length})</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDetail;
