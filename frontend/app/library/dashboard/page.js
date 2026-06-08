"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";

export default function LibraryDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/library/reports").then(setD).catch(() => {}); }, []);
  const s = d?.stats || {};
  const cat = (d?.byCategory || []).map((c) => ({ name: c.category || "Other", value: c.cnt }));
  return (
    <AppShell title="Library Dashboard" allow={["super_admin", "admin", "librarian"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Books" value={s.total_books ?? "—"} icon="BookOpen" />
        <StatCard title="Copies" value={s.total_copies ?? "—"} icon="Library" color="text-green-600" />
        <StatCard title="Issued" value={s.issued ?? "—"} icon="BookUp" color="text-amber-600" />
        <StatCard title="Overdue" value={s.overdue ?? "—"} icon="AlertTriangle" color="text-red-600" />
      </div>
      <ChartCard title="Books by Category" type="pie" data={cat} xKey="name" dataKey="value" />
    </AppShell>
  );
}
