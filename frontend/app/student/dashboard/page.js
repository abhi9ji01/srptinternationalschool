"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";

export default function StudentDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/reports/dashboard/student").then(setD).catch(() => {}); }, []);
  return (
    <AppShell title="Student Dashboard" allow={["super_admin", "admin", "student"]}>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="Attendance" value={`${d?.attendancePercent ?? 0}%`} icon="ClipboardCheck"
          color={(d?.attendancePercent ?? 100) < 75 ? "text-red-600" : "text-green-600"} />
        <StatCard title="Class" value={d?.student?.section_name ? `Sec ${d.student.section_name}` : "—"} icon="School" />
        <StatCard title="Roll No." value={d?.student?.roll_number ?? "—"} icon="Hash" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Today&apos;s Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(d?.periods || []).length === 0 ? <EmptyState title="No classes today" /> :
              d.periods.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-md p-3">
                  <div><p className="font-medium">{p.subject_name}</p><p className="text-xs text-muted-foreground">{p.teacher_name}</p></div>
                  <Badge variant="outline">P{p.period_number} · {p.start_time?.slice(0,5)}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
        <ChartCard title="My Marks Trend (%)" type="line" data={d?.marksTrend || []} xKey="exam" dataKey="pct" />
      </div>
    </AppShell>
  );
}
