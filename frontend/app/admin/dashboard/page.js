"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get("/reports/dashboard/admin").then(setD).catch(() => {});
  }, []);

  const s = d?.stats || {};
  return (
    <AppShell title="Admin Dashboard" allow={["super_admin", "admin"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Students" value={s.students ?? "—"} icon="GraduationCap" />
        <StatCard title="Teachers" value={s.teachers ?? "—"} icon="Users" color="text-green-600" />
        <StatCard title="Fees Collected" value={formatCurrency(s.fees_collected)} icon="Wallet" color="text-amber-600" />
        <StatCard title="Fees Pending" value={formatCurrency(s.fees_pending)} icon="AlertTriangle" color="text-red-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Enrollment Trend" type="line" data={d?.enrollment || []} xKey="month" dataKey="count" />
        <ChartCard title="Fee Collection (monthly)" type="bar" data={d?.feeByMonth || []} xKey="month" dataKey="total" />
        <ChartCard title="Attendance % (last 14 days)" type="line" data={d?.attendanceByDay || []} xKey="date" dataKey="percent" />
        <ChartCard title="Subject Performance (avg %)" type="radar" data={d?.subjectPerformance || []} xKey="subject" dataKey="avg_pct" />
      </div>
    </AppShell>
  );
}
