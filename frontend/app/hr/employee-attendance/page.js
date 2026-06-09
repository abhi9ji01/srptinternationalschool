"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { statusColor } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

const STATUSES = ["present", "absent", "late", "half_day", "leave"];
const today = new Date().toISOString().slice(0, 10);

export default function EmployeeAttendancePage() {
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api.get(`/employee-attendance?date=${date}`); setRows(Array.isArray(d) ? d : []); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [date]);
  useEffect(() => { load(); }, [load]);

  async function mark(userId, status) {
    try {
      await api.post("/employee-attendance/mark", { user_id: userId, date, status });
      setRows((prev) => prev.map((r) => (r.user_id === userId ? { ...r, status } : r)));
      toast.success("Marked");
    } catch (e) { toast.error(e.message); }
  }

  const marked = rows.filter((r) => r.status).length;

  return (
    <AppShell title="Employee Attendance" allow={["super_admin", "admin", "hr_manager"]}>
      <Card className="mb-4"><CardContent className="flex flex-wrap items-end gap-3 pt-6">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <p className="ml-auto text-sm text-muted-foreground">{marked}/{rows.length} marked</p>
      </CardContent></Card>

      <Card><CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-44">Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{ROLE_LABELS?.[r.role] || r.role}</TableCell>
                  <TableCell>{r.check_in || "—"}</TableCell>
                  <TableCell>{r.check_out || "—"}</TableCell>
                  <TableCell>{r.status ? <Badge className={statusColor(r.status)} variant="outline">{r.status}</Badge> : <span className="text-xs text-muted-foreground">unmarked</span>}</TableCell>
                  <TableCell>
                    <Select value={r.status || ""} onValueChange={(v) => mark(r.user_id, v)}>
                      <SelectTrigger><SelectValue placeholder="Set status" /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AppShell>
  );
}
