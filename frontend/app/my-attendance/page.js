"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogIn, LogOut, Clock } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate, statusColor } from "@/lib/utils";

const ALLOW = [
  "super_admin", "admin", "teacher", "accountant", "librarian", "transport_manager",
  "hostel_warden", "hr_manager", "security_guard", "canteen_manager", "health_officer",
];
const now = new Date();

export default function MyAttendancePage() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([
        api.get("/employee-attendance/today"),
        api.get(`/employee-attendance/my?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
      ]);
      setToday(t || null);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(kind) {
    setBusy(true);
    try {
      await api.post(`/employee-attendance/${kind}`, {});
      toast.success(kind === "check-in" ? "Checked in" : "Checked out");
      load();
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  }

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;

  return (
    <AppShell title="My Attendance" allow={ALLOW}>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6 pt-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Clock className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="font-semibold">
                    {today?.status ? <Badge className={statusColor(today.status)} variant="outline">{today.status}</Badge> : "Not checked in"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    In: {today?.check_in || "—"} · Out: {today?.check_out || "—"}
                  </p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Button onClick={() => act("check-in")} disabled={busy || checkedIn}><LogIn className="h-4 w-4" /> Check In</Button>
                <Button onClick={() => act("check-out")} disabled={busy || !checkedIn || checkedOut} variant="outline"><LogOut className="h-4 w-4" /> Check Out</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">This Month</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <EmptyState title="No records" description="Your attendance for this month will show here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell><Badge className={statusColor(r.status)} variant="outline">{r.status}</Badge></TableCell>
                        <TableCell>{r.check_in || "—"}</TableCell>
                        <TableCell>{r.check_out || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
