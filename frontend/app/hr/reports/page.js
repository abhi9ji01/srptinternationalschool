"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";

export default function HrReportsPage() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/reports/dashboard/hr").then(setD).catch((e) => toast.error(e.message)); }, []);

  const s = d?.stats || {};
  const byDept = (d?.byDept || []).map((x) => ({ name: x.department || "Other", value: x.count }));

  return (
    <AppShell title="HR Reports" allow={["super_admin", "admin", "hr_manager"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard title="Total Staff" value={s.staff ?? "—"} icon="Users" />
        <StatCard title="Pending Leaves" value={s.pending_leaves ?? "—"} icon="CalendarClock" color="text-amber-600" />
        <StatCard title="Pending Payroll" value={s.pending_payroll ?? "—"} icon="Wallet" color="text-red-600" />
      </div>
      <ChartCard title="Staff by Department" type="bar" data={byDept} xKey="name" dataKey="value" />
    </AppShell>
  );
}
