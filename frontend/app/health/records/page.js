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

const EMPTY = { student_id: "", blood_group: "", height: "", weight: "", allergies: "", medical_conditions: "", doctor_name: "", last_checkup_date: "" };

export default function HealthRecordsPage() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/health/records");
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
      await api.post("/health/records", form);
      toast.success("Record saved");
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "admission_number", header: "Admission No." },
    { key: "class_name", header: "Class" },
    { key: "section_name", header: "Section" },
    { key: "blood_group", header: "Blood Group" },
    { key: "last_checkup_date", header: "Last Checkup", render: (r) => formatDate(r.last_checkup_date) },
  ];

  return (
    <AppShell title="Health Records" allow={["super_admin", "admin", "health_officer"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No health records"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add/Update Record</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add / Update Record</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>Student</Label>
                    <Select value={form.student_id ? String(form.student_id) : ""} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Input value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor Name</Label>
                    <Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Allergies</Label>
                    <Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Medical Conditions</Label>
                    <Textarea value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Last Checkup Date</Label>
                    <Input type="date" value={form.last_checkup_date} onChange={(e) => setForm({ ...form, last_checkup_date: e.target.value })} />
                  </div>
                  <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
