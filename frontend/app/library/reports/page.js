"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function LibraryReportsPage() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/library/reports").then(setD).catch((e) => toast.error(e.message)); }, []);

  const s = d?.stats || {};
  const cat = (d?.byCategory || []).map((c) => ({ name: c.category || "Other", value: c.cnt }));

  return (
    <AppShell title="Library Reports" allow={["super_admin", "admin", "librarian"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard title="Total Books" value={s.total_books ?? "—"} icon="BookOpen" />
        <StatCard title="Total Copies" value={s.total_copies ?? "—"} icon="Library" color="text-green-600" />
        <StatCard title="Issued" value={s.issued ?? "—"} icon="BookUp" color="text-amber-600" />
        <StatCard title="Overdue" value={s.overdue ?? "—"} icon="AlertTriangle" color="text-red-600" />
        <StatCard title="Fines Collected" value={formatCurrency(s.fines_collected)} icon="IndianRupee" color="text-emerald-600" />
      </div>
      <ChartCard title="Books by Category" type="pie" data={cat} xKey="name" dataKey="value" />
    </AppShell>
  );
}
