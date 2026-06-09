"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Users } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const NONE = "__none__";
const empty = { name: "", capacity: 40, class_teacher_id: "" };

export default function ClassSectionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // null | "create" | row
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [delRow, setDelRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/classes/${id}/sections`);
      const list = Array.isArray(data) ? data : data.data || [];
      setRows(list);
      if (list[0]?.class_name) setClassName(list[0].class_name);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // class name fallback + teacher options (sections.class_teacher_id → users.id, so use user_id)
    api.get("/classes").then((d) => {
      const arr = Array.isArray(d) ? d : d.data || [];
      const c = arr.find((x) => String(x.id) === String(id));
      if (c) setClassName(c.name);
    }).catch(() => {});
    api.get("/teachers").then((d) => setTeachers((Array.isArray(d) ? d : d.data || []))).catch(() => {});
  }, [id]);

  function openCreate() { setForm(empty); setDialog("create"); }
  function openEdit(row) {
    setForm({ name: row.name, capacity: row.capacity ?? 40, class_teacher_id: row.class_teacher_id ? String(row.class_teacher_id) : "" });
    setDialog(row);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        capacity: Number(form.capacity) || 40,
        class_teacher_id: form.class_teacher_id && form.class_teacher_id !== NONE ? Number(form.class_teacher_id) : null,
      };
      if (dialog === "create") {
        await api.post(`/classes/${id}/sections`, payload);
        toast.success("Section created");
      } else {
        await api.put(`/classes/${id}/sections/${dialog.id}`, payload);
        toast.success("Section updated");
      }
      setDialog(null); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  async function confirmDelete() {
    try {
      await api.del(`/classes/${id}/sections/${delRow.id}`);
      toast.success("Section deleted");
      setDelRow(null); load();
    } catch (e) {
      toast.error(e.message);
      setDelRow(null);
    }
  }

  const columns = [
    { key: "name", header: "Section", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "capacity", header: "Capacity" },
    { key: "class_teacher_name", header: "Class Teacher", render: (r) => r.class_teacher_name || <span className="text-muted-foreground">Unassigned</span> },
    {
      key: "student_count", header: "Students",
      render: (r) => <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{Number(r.student_count || 0)}</span>,
    },
    {
      key: "_actions", header: "", className: "text-right",
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="text-destructive" title="Delete" onClick={() => setDelRow(r)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title={`Sections${className ? ` · ${className}` : ""}`} allow={["super_admin", "admin"]}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/classes")}>
          <ArrowLeft className="h-4 w-4" /> Back to Classes
        </Button>
        <Card><CardContent className="pt-6">
          <DataTable
            columns={columns} data={rows} loading={loading} emptyTitle="No sections yet"
            actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Section</Button>}
          />
        </CardContent></Card>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "create" ? "Add Section" : `Edit Section ${dialog?.name || ""}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="A" required maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Class Teacher</Label>
              <Select value={form.class_teacher_id || NONE} onValueChange={(v) => setForm({ ...form, class_teacher_id: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.user_id} value={String(t.user_id)}>{t.name}{t.department ? ` · ${t.department}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : dialog === "create" ? "Create" : "Save changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm — student-count aware */}
      <Dialog open={!!delRow} onOpenChange={(v) => !v && setDelRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section {delRow?.name}?</DialogTitle>
            <DialogDescription>
              {Number(delRow?.student_count || 0) > 0
                ? `This section has ${delRow?.student_count} student(s). Cannot delete — reassign students first.`
                : `Are you sure you want to delete Section ${delRow?.name}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelRow(null)}>Cancel</Button>
            <Button variant="destructive" disabled={Number(delRow?.student_count || 0) > 0} onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
