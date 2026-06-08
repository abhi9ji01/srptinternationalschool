"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";

const STATUSES = ["present", "absent", "late", "excused"];
const COLORS = { present: "bg-green-600", absent: "bg-red-600", late: "bg-amber-500", excused: "bg-blue-600" };

export default function TeacherAttendancePage() {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/sections-detailed").then(setSections).catch(() => {}); }, []);

  async function load() {
    if (!sectionId) return toast.error("Select a section");
    setLoading(true);
    try {
      const d = await api.get(`/attendance?section_id=${sectionId}&date=${date}`);
      setRows((d.students || []).map((s) => ({ ...s, status: s.status || "present" })));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  function setStatus(id, status) {
    setRows((rs) => rs.map((r) => (r.student_id === id ? { ...r, status } : r)));
  }

  async function save() {
    try {
      const res = await api.post("/attendance/bulk", { date, records: rows.map((r) => ({ student_id: r.student_id, status: r.status })) });
      toast.success(`Saved ${res.marked} records${res.notified ? `, ${res.notified} parents notified` : ""}`);
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Mark Attendance" allow={["super_admin", "admin", "teacher"]}>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load}>Load</Button>
          {rows.length > 0 && <Button onClick={save} variant="default" className="ml-auto">Save Attendance</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Students {rows.length > 0 && `(${rows.length})`}</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? <EmptyState title="No data" description="Select a section and date, then click Load." /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.student_id}>
                    <TableCell>{r.roll_number}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {STATUSES.map((st) => (
                          <button key={st} onClick={() => setStatus(r.student_id, st)}
                            className={`px-3 py-1 rounded text-xs capitalize ${r.status === st ? `${COLORS[st]} text-white` : "bg-muted"}`}>
                            {st}
                          </button>
                        ))}
                      </div>
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
