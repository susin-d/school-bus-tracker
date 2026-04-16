import { useState } from "react";
import { useAuth, Driver } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const emptyForm = { name: "", age: "", gender: "", mobile: "", licenseDetails: "", photo: "" };

const Drivers = () => {
  const { user, drivers, addDriver, updateDriver, removeDriver } = useAuth();
  const schoolDrivers = drivers.filter(d => d.schoolId === user?.schoolId);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = schoolDrivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, age: parseInt(form.age), schoolId: user?.schoolId || "" };
    try {
      if (editId) {
        await updateDriver(editId, data);
        toast.success("Driver updated");
      } else {
        await addDriver(data);
        toast.success("Driver added");
      }
      setForm(emptyForm);
      setEditId(null);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save driver");
    }
  };

  const handleEdit = (d: Driver) => {
    setForm({ name: d.name, age: String(d.age), gender: d.gender, mobile: d.mobile, licenseDetails: d.licenseDetails, photo: d.photo || "" });
    setEditId(d.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Driver Management</h1>
          <p className="text-muted-foreground">{schoolDrivers.length} drivers registered</p>
        </div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Driver</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Driver" : "Add Driver"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: "Name", key: "name", type: "text" },
                { label: "Age", key: "age", type: "number" },
                { label: "Gender", key: "gender", type: "text" },
                { label: "Mobile", key: "mobile", type: "text" },
                { label: "License Details", key: "licenseDetails", type: "text" },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
                </div>
              ))}
              <Button type="submit" className="w-full">{editId ? "Update" : "Add"} Driver</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No drivers found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(d => (
            <Card key={d.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-muted-foreground">{d.gender}, {d.age}yrs · {d.mobile} · License: {d.licenseDetails}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    try {
                      await removeDriver(d.id);
                      toast.success("Driver removed");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to remove driver");
                    }
                  }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Drivers;
