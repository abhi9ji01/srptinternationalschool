"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";

export default function TeacherDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/reports/dashboard/teacher").then(setD).catch(() => {}); }, []);
  const s = d?.stats || {};
  return (
    <AppShell title="Teacher Dashboard" allow={["super_admin", "admin", "teacher"]}>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="My Sections" value={s.sections ?? "—"} icon="School" />
        <StatCard title="Assignments" value={s.assignments ?? "—"} icon="BookMarked" color="text-green-600" />
        <StatCard title="Exams" value={s.exams ?? "—"} icon="FileSpreadsheet" color="text-amber-600" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Today&apos;s Periods</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(d?.periods || []).length === 0 ? <EmptyState title="No periods today" /> :
              d.periods.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium">{p.subject_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.class_name} {p.section_name}</p>
                  </div>
                  <Badge variant="outline">P{p.period_number} · {p.start_time?.slice(0,5)}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
        <ChartCard title="Class Average per Exam (%)" type="bar" data={d?.classAvg || []} xKey="exam" dataKey="avg_pct" />
      </div>
    </AppShell>
  );
}
