"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";

const STATUSES = ["present", "absent", "late", "half_day"];
const COLORS = { present: "bg-green-600", absent: "bg-red-600", late: "bg-amber-500", half_day: "bg-blue-600" };

export default function HrAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api.get(`/teacher-attendance?date=${date}`);
      const arr = Array.isArray(d) ? d : d.data || [];
      setRows(arr.map((r) => ({ ...r, status: r.status || "present" })));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function setStatus(id, status) {
    setRows((rs) => rs.map((r) => (r.teacher_id === id ? { ...r, status } : r)));
  }

  async function save() {
    try {
      await api.post("/teacher-attendance", {
        date,
        records: rows.map((r) => ({ teacher_id: r.teacher_id, status: r.status })),
      });
      toast.success("Attendance saved");
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Staff Attendance" allow={["super_admin", "admin", "hr_manager"]}>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load}>Load</Button>
          {rows.length > 0 && <Button onClick={save} className="ml-auto">Save Attendance</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Staff {rows.length > 0 && `(${rows.length})`}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <EmptyState title="Loading..." description="Fetching staff attendance." />
          ) : rows.length === 0 ? (
            <EmptyState title="No data" description="Pick a date and click Load." />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.teacher_id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.department || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {STATUSES.map((st) => (
                          <button key={st} type="button" onClick={() => setStatus(r.teacher_id, st)}
                            className={`px-3 py-1 rounded text-xs capitalize ${r.status === st ? `${COLORS[st]} text-white` : "bg-muted"}`}>
                            {st.replace("_", " ")}
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
