import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Copy } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const Schools = () => {
  const { schools, addSchool, removeSchool } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", email: "", contact: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSchool(form);
      setForm({ name: "", address: "", email: "", contact: "" });
      setOpen(false);
      toast.success("School added and linked to backend.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add school");
    }
  };

  const copyCredentials = (username: string, password: string) => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    toast.success("Credentials copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Manage Schools</h1>
          <p className="text-muted-foreground">Add and manage schools in the system</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add School</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New School</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Add School</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {schools.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No schools added yet. Click "Add School" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schools.map(school => (
            <Card key={school.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{school.address}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={async () => {
                  try {
                    await removeSchool(school.id);
                    toast.success("School removed");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to remove school");
                  }
                }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {school.email}</div>
                  <div><span className="text-muted-foreground">Contact:</span> {school.contact}</div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">Admin Credentials</p>
                    <p className="text-muted-foreground">Username: {school.adminUsername} | Password: {school.adminPassword}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyCredentials(school.adminUsername, school.adminPassword)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schools;
