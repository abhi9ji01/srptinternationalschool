"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Download, Upload, Eye } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [delId, setDelId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/students?limit=200");
      setStudents(data.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => {
    load();
    api.get("/sections-detailed").then(setSections).catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post("/students", form);
      toast.success("Student added");
      setOpen(false); setForm({}); load();
    } catch (e) { toast.error(e.message); }
  }

  async function remove() {
    await api.del(`/students/${delId}`);
    toast.success("Student deactivated");
    load();
  }

  async function importExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    if (form.section_id) fd.append("section_id", form.section_id);
    try {
      const res = await api.upload("/students/import/excel", fd);
      toast.success(`Imported ${res.created}, failed ${res.failed}`);
      load();
    } catch (e) { toast.error(e.message); }
    e.target.value = "";
  }

  const columns = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "admission_number", header: "Adm. No." },
    { key: "roll_number", header: "Roll" },
    { key: "class_name", header: "Class", render: (r) => `${r.class_name || "—"} ${r.section_name || ""}` },
    { key: "guardian_phone", header: "Guardian" },
    { key: "user_active", header: "Status", render: (r) => <Badge variant={r.user_active ? "default" : "secondary"}>{r.user_active ? "Active" : "Inactive"}</Badge> },
    { key: "id", header: "Actions", render: (r) => (
      <div className="flex gap-1">
        <Button asChild size="icon" variant="ghost"><Link href={`/admin/students/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelId(r.id)}>Deactivate</Button>
      </div>
    ) },
  ];

  return (
    <AppShell title="Students" allow={["super_admin", "admin"]}>
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={students}
            loading={loading}
            emptyTitle="No students yet"
            actions={
              <>
                <Button variant="outline" onClick={() => api.download("/students/export/excel", "students.xlsx")}><Download className="h-4 w-4" /> Export</Button>
                <Button variant="outline" onClick={() => api.download("/students/import/template", "template.xlsx")}><Download className="h-4 w-4" /> Template</Button>
                <label>
                  <input type="file" accept=".xlsx,.csv" className="hidden" onChange={importExcel} />
                  <Button variant="outline" asChild><span><Upload className="h-4 w-4" /> Import</span></Button>
                </label>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Student</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
                    <form onSubmit={create} className="grid grid-cols-2 gap-3">
                      <Field label="Name" req v={form.name} on={(v) => setForm({ ...form, name: v })} />
                      <Field label="Email" req type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
                      <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
                      <Field label="Admission No." v={form.admission_number} on={(v) => setForm({ ...form, admission_number: v })} />
                      <Field label="Roll No." v={form.roll_number} on={(v) => setForm({ ...form, roll_number: v })} />
                      <div className="space-y-2">
                        <Label>Section</Label>
                        <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Field label="Father Name" v={form.father_name} on={(v) => setForm({ ...form, father_name: v })} />
                      <Field label="Mother Name" v={form.mother_name} on={(v) => setForm({ ...form, mother_name: v })} />
                      <Field label="Guardian Phone" v={form.guardian_phone} on={(v) => setForm({ ...form, guardian_phone: v })} />
                      <Field label="DOB" type="date" v={form.dob} on={(v) => setForm({ ...form, dob: v })} />
                      <p className="col-span-2 text-xs text-muted-foreground">Default password: student123</p>
                      <DialogFooter className="col-span-2">
                        <Button type="submit">Create</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            }
          />
        </CardContent>
      </Card>
      <ConfirmDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)} onConfirm={remove}
        title="Deactivate student?" description="The student and their account will be deactivated." confirmText="Deactivate" />
    </AppShell>
  );
}

function Field({ label, v, on, type = "text", req }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={v || ""} onChange={(e) => on(e.target.value)} required={req} />
    </div>
  );
}
