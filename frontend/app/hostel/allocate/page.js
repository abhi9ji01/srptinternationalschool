"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const EMPTY = { student_id: "", room_id: "", monthly_fee: "" };

export default function HostelAllocatePage() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/students?limit=200").then((d) => setStudents(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/hostel/rooms").then((d) => setRooms(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.student_id || !form.room_id) return toast.error("Select student and room");
    setSubmitting(true);
    try {
      await api.post("/hostel/allocate", {
        student_id: form.student_id,
        room_id: form.room_id,
        monthly_fee: form.monthly_fee || 0,
      });
      toast.success("Student allocated to room");
      setForm(EMPTY);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  return (
    <AppShell title="Allocate Hostel Room" allow={["super_admin", "admin", "hostel_warden"]}>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-base">Allocate Room</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={form.student_id ? String(form.student_id) : ""} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select value={form.room_id ? String(form.room_id) : ""} onValueChange={(v) => setForm({ ...form, room_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => <SelectItem key={r.id} value={String(r.id)}>{`${r.room_number} (${r.hostel_name})`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly Fee</Label>
              <Input type="number" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} />
            </div>
            <div>
              <Button type="submit" disabled={submitting}>{submitting ? "Allocating..." : "Allocate"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
