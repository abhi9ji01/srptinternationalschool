"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const EMPTY = { student_id: "", visit_date: new Date().toISOString().slice(0, 10), symptoms: "", diagnosis: "", treatment: "", medicine_given: "" };

export default function HealthVisitsPage() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/health/visits");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    api.get("/students?limit=200").then((d) => setStudents(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, [load]);

  async function create(e) {
    e.preventDefault();
    if (!form.student_id) return toast.error("Select a student");
    try {
      await api.post("/health/visits", form);
      toast.success("Visit logged");
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "visit_date", header: "Date", render: (r) => formatDate(r.visit_date) },
    { key: "symptoms", header: "Symptoms" },
    { key: "diagnosis", header: "Diagnosis" },
    { key: "treatment", header: "Treatment" },
  ];

  return (
    <AppShell title="Medical Visits" allow={["super_admin", "admin", "health_officer"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No visits logged"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Log Visit</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Log Visit</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid gap-3">
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
                    <Label>Visit Date</Label>
                    <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Symptoms</Label>
                    <Textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnosis</Label>
                    <Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Treatment</Label>
                    <Textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Medicine Given</Label>
                    <Textarea value={form.medicine_given} onChange={(e) => setForm({ ...form, medicine_given: e.target.value })} />
                  </div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
