"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function ExamMarksPage() {
  const { id } = useParams();
  const fileRef = useRef(null);
  const [exam, setExam] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api.get(`/exams/${id}/marks`);
      setExam(d.exam || null);
      setRows((d.students || []).map((s) => ({
        student_id: s.student_id,
        name: s.name,
        roll_number: s.roll_number,
        marks_obtained: s.marks_obtained ?? "",
        grade: s.grade,
        is_absent: !!s.is_absent,
      })));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

  function update(sid, patch) {
    setRows((rs) => rs.map((r) => (r.student_id === sid ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await api.post(`/exams/${id}/marks`, {
        marks: rows.map((r) => ({
          student_id: r.student_id,
          marks_obtained: r.is_absent ? null : (r.marks_obtained === "" ? null : Number(r.marks_obtained)),
          is_absent: r.is_absent,
        })),
      });
      toast.success(`Saved ${res.saved} records${res.errors?.length ? `, ${res.errors.length} errors` : ""}`);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  async function downloadTemplate() {
    try {
      await api.download("/exams/marks/template", "marks_template.xlsx");
    } catch (e) { toast.error(e.message || "Download failed"); }
  }

  async function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.upload(`/exams/${id}/marks/import`, fd);
      toast.success(`Imported ${res.saved}${res.failed ? `, ${res.failed} failed` : ""}`);
      load();
    } catch (err) { toast.error(err.message || "Import failed"); }
    if (fileRef.current) fileRef.current.value = "";
  }

  const total = exam?.total_marks;

  return (
    <AppShell title={exam ? `Marks: ${exam.name}` : "Marks Entry"} allow={["super_admin", "admin", "teacher"]}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">
            {exam ? `${exam.name} (Total: ${exam.total_marks})` : "Marks Entry"}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4" /> Template</Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImport} />
            <Button size="sm" onClick={save} disabled={saving || rows.length === 0}>{saving ? "Saving..." : "Save Marks"}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No students" description="No active students found for this exam's section." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-40">Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="w-24">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.student_id}>
                    <TableCell>{r.roll_number}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Input type="number" min={0} max={total} disabled={r.is_absent}
                        value={r.is_absent ? "" : r.marks_obtained}
                        onChange={(e) => update(r.student_id, { marks_obtained: e.target.value })}
                        className="w-28" />
                    </TableCell>
                    <TableCell>{r.is_absent ? "AB" : (r.grade || "—")}</TableCell>
                    <TableCell>
                      <Checkbox checked={r.is_absent} onCheckedChange={(v) => update(r.student_id, { is_absent: !!v })} />
                    </TableCell>
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
