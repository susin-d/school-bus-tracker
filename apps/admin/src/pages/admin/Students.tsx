import { useState } from "react";
import { useAuth, Student } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const emptyForm = { name: "", class: "", section: "", admissionNumber: "", parentName: "", parentContact: "", bloodGroup: "", pickupPoint: "", photo: "" };

const Students = () => {
  const { user, students, addStudent, updateStudent, removeStudent } = useAuth();
  const schoolStudents = students.filter(s => s.schoolId === user?.schoolId);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = schoolStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateStudent(editId, form);
        toast.success("Student updated");
      } else {
        await addStudent({ ...form, schoolId: user?.schoolId || "" });
        toast.success("Student added");
      }
      setForm(emptyForm);
      setEditId(null);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save student");
    }
  };

  const handleEdit = (s: Student) => {
    setForm({ name: s.name, class: s.class, section: s.section, admissionNumber: s.admissionNumber, parentName: s.parentName, parentContact: s.parentContact, bloodGroup: s.bloodGroup, pickupPoint: s.pickupPoint, photo: s.photo || "" });
    setEditId(s.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Student Management</h1>
          <p className="text-muted-foreground">{schoolStudents.length} students registered</p>
        </div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: "Name", key: "name" },
                { label: "Class", key: "class" },
                { label: "Section", key: "section" },
                { label: "Admission Number", key: "admissionNumber" },
                { label: "Parent Name", key: "parentName" },
                { label: "Parent Contact", key: "parentContact" },
                { label: "Blood Group", key: "bloodGroup" },
                { label: "Pickup Point", key: "pickupPoint" },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
                </div>
              ))}
              <Button type="submit" className="w-full">{editId ? "Update" : "Add"} Student</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No students found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <Card key={s.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">Class {s.class}-{s.section} · {s.admissionNumber} · Pickup: {s.pickupPoint}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    try {
                      await removeStudent(s.id);
                      toast.success("Student removed");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to remove student");
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

export default Students;
