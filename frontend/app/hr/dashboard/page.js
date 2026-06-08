"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";

export default function HRDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/reports/dashboard/hr").then(setD).catch(() => {}); }, []);
  const s = d?.stats || {};
  const dept = (d?.byDept || []).map((x) => ({ name: x.department || "Other", value: x.count }));
  const leaves = (d?.leaveDist || []).map((x) => ({ name: x.name, value: x.count }));
  return (
    <AppShell title="HR Dashboard" allow={["super_admin", "admin", "hr_manager"]}>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="Total Staff" value={s.staff ?? "—"} icon="Users" />
        <StatCard title="Pending Leaves" value={s.pending_leaves ?? "—"} icon="CalendarOff" color="text-amber-600" />
        <StatCard title="Pending Payroll" value={s.pending_payroll ?? "—"} icon="Banknote" color="text-red-600" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Department-wise Headcount" type="bar" data={dept} xKey="name" dataKey="value" />
        <ChartCard title="Leave Type Distribution" type="pie" data={leaves} xKey="name" dataKey="value" />
      </div>
    </AppShell>
  );
}
