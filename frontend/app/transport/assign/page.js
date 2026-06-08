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

const EMPTY = { student_id: "", route_id: "", vehicle_id: "", pickup_stop: "", drop_stop: "", monthly_fee: "" };

export default function TransportAssignPage() {
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/students?limit=200").then((d) => setStudents(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/transport/routes").then((d) => setRoutes(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/transport/vehicles").then((d) => setVehicles(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.student_id) return toast.error("Select a student");
    setSubmitting(true);
    try {
      await api.post("/transport/assign", {
        student_id: form.student_id,
        route_id: form.route_id || null,
        vehicle_id: form.vehicle_id || null,
        pickup_stop: form.pickup_stop || null,
        drop_stop: form.drop_stop || null,
        monthly_fee: form.monthly_fee || 0,
      });
      toast.success("Student assigned to transport");
      setForm(EMPTY);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  return (
    <AppShell title="Assign Transport" allow={["super_admin", "admin", "transport_manager"]}>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-base">Assign Student to Transport</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Student</Label>
              <Select value={form.student_id ? String(form.student_id) : ""} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Route</Label>
              <Select value={form.route_id ? String(form.route_id) : ""} onValueChange={(v) => setForm({ ...form, route_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  {routes.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.route_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicle_id ? String(form.vehicle_id) : ""} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.vehicle_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pickup Stop</Label>
              <Input value={form.pickup_stop} onChange={(e) => setForm({ ...form, pickup_stop: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Drop Stop</Label>
              <Input value={form.drop_stop} onChange={(e) => setForm({ ...form, drop_stop: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Monthly Fee</Label>
              <Input type="number" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Assigning..." : "Assign"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
