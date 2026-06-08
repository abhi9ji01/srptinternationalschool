"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { statusColor } from "@/lib/utils";

export default function TeacherPtmPage() {
  const [teacherId, setTeacherId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  async function loadSlots(tId) {
    if (!tId) { setSlots([]); return; }
    try {
      const d = await api.get(`/ptm/slots?teacher_id=${tId}`);
      setSlots(Array.isArray(d) ? d : d.data || []);
    } catch (e) { setSlots([]); }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dash = await api.get("/reports/dashboard/teacher");
        const tId = dash?.teacherId || null;
        setTeacherId(tId);
        await loadSlots(tId);
      } catch (e) { toast.error(e.message); }
      try {
        const s = await api.get("/ptm/sessions");
        setSessions(Array.isArray(s) ? s : s.data || []);
      } catch (e) { setSessions([]); }
      setLoading(false);
    })();
  }, []);

  async function createSlot(e) {
    e.preventDefault();
    if (!teacherId) return toast.error("No teacher record found");
    if (!form.ptm_session_id) return toast.error("Select a session");
    try {
      await api.post("/ptm/slots", {
        ptm_session_id: form.ptm_session_id,
        teacher_id: teacherId,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      toast.success("Slot created");
      setOpen(false);
      setForm({});
      loadSlots(teacherId);
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Parent-Teacher Meetings" allow={["super_admin", "admin", "teacher"]}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">My PTM Slots</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Add Slot</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create PTM Slot</DialogTitle></DialogHeader>
              <form onSubmit={createSlot} className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Session</Label>
                  <Select value={form.ptm_session_id ? String(form.ptm_session_id) : ""} onValueChange={(v) => setForm({ ...form, ptm_session_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
                <DialogFooter className="col-span-2"><Button type="submit">Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : slots.length === 0 ? (
            <EmptyState title="No slots" description="Create a PTM slot for parents to book." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead>Student</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.start_time}</TableCell>
                    <TableCell>{s.end_time}</TableCell>
                    <TableCell><Badge className={statusColor(s.status)} variant="outline">{s.status || "available"}</Badge></TableCell>
                    <TableCell>{s.is_booked ? "Yes" : "No"}</TableCell>
                    <TableCell>{s.student_name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
