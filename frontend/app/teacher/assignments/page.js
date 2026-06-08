"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AssignmentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [delRow, setDelRow] = useState(null);
  const [form, setForm] = useState({});

  async function load() {
    setLoading(true);
    try {
      const d = await api.get("/assignments");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.get("/sections-detailed").then((d) => setSections(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/subjects-detailed").then((d) => setSubjects(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required");
    try {
      await api.post("/assignments", form);
      toast.success("Assignment created");
      setOpen(false);
      setForm({});
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function remove() {
    try {
      await api.del(`/assignments/${delRow.id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "subject_name", header: "Subject" },
    { key: "section_name", header: "Section" },
    { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
    { key: "total_marks", header: "Marks" },
    { key: "submission_count", header: "Submissions" },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex gap-1 justify-end">
          <Button asChild size="sm" variant="outline"><Link href={`/teacher/assignments/${r.id}`}>View</Link></Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelRow(r)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Assignments" allow={["super_admin", "admin", "teacher"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No assignments yet"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Create</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>Title</Label>
                    <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={form.subject_id ? String(form.subject_id) : ""} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={form.section_id ? String(form.section_id) : ""} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="datetime-local" value={form.due_date || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Marks</Label>
                    <Input type="number" value={form.total_marks ?? ""} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} />
                  </div>
                  <DialogFooter className="col-span-2"><Button type="submit">Create</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
      <ConfirmDialog open={!!delRow} onOpenChange={(v) => !v && setDelRow(null)} onConfirm={remove}
        title="Delete this assignment?" description="This action cannot be undone." />
    </AppShell>
  );
}
