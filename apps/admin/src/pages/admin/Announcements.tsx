import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const AdminAnnouncements = () => {
  const { user, announcements, addAnnouncement } = useAuth();
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"parents" | "drivers" | "everyone">("everyone");

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await addAnnouncement({ message, target, author: user?.username || "Admin", schoolId: user?.schoolId });
      setMessage("");
      toast.success("Announcement posted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post announcement");
    }
  };

  const myAnnouncements = announcements.filter(a => a.schoolId === user?.schoolId || a.author === "Super Admin");

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold">Announcements</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={target} onValueChange={(v: any) => setTarget(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="parents">Parents Only</SelectItem>
                <SelectItem value="drivers">Drivers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Type your announcement..." />
          </div>
          <Button onClick={handleSend} className="gap-2"><Megaphone className="w-4 h-4" /> Post Announcement</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {myAnnouncements.map(a => (
          <Card key={a.id}>
            <CardContent className="py-4">
              <p className="text-sm">{a.message}</p>
              <p className="text-xs text-muted-foreground mt-1">By: {a.author} · To: {a.target} · {new Date(a.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
