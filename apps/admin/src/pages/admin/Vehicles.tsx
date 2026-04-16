import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const Vehicles = () => {
  const { user, vehicles, addVehicle, removeVehicle } = useAuth();
  const navigate = useNavigate();
  const schoolVehicles = vehicles.filter(v => v.schoolId === user?.schoolId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "bus" as "car" | "van" | "bus", vehicleNumber: "", numberPlate: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVehicle({ ...form, schoolId: user?.schoolId || "" });
      setForm({ type: "bus", vehicleNumber: "", numberPlate: "" });
      setOpen(false);
      toast.success("Vehicle added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add vehicle");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Vehicle Management</h1>
          <p className="text-muted-foreground">{schoolVehicles.length} vehicles registered</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Vehicle Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Vehicle Number</Label>
                <Input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Number Plate</Label>
                <Input value={form.numberPlate} onChange={e => setForm({ ...form, numberPlate: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Add Vehicle</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {schoolVehicles.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No vehicles added yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {schoolVehicles.map(v => (
            <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/admin/vehicles/${v.id}`)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{v.type} — {v.vehicleNumber}</p>
                  <p className="text-sm text-muted-foreground">Plate: {v.numberPlate} · Driver: {v.assignedDriverId ? "Assigned" : "None"} · Students: {v.assignedStudentIds.length}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={async e => {
                    e.stopPropagation();
                    try {
                      await removeVehicle(v.id);
                      toast.success("Vehicle removed");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to remove vehicle");
                    }
                  }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vehicles;
