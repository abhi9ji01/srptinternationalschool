"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function AccountantDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/reports/dashboard/accountant").then(setD).catch(() => {}); }, []);
  const s = d?.stats || {};
  const modes = (d?.paymentModes || []).map((m) => ({ name: m.mode, value: Number(m.total) }));
  return (
    <AppShell title="Accountant Dashboard" allow={["super_admin", "admin", "accountant"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Collected" value={formatCurrency(s.collected)} icon="Wallet" color="text-green-600" />
        <StatCard title="Pending" value={formatCurrency(s.pending)} icon="Clock" color="text-amber-600" />
        <StatCard title="Overdue" value={formatCurrency(s.overdue)} icon="AlertTriangle" color="text-red-600" />
        <StatCard title="Expenses" value={formatCurrency(s.expenses)} icon="TrendingDown" color="text-purple-600" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Collection vs Expense" type="bar" data={d?.collectionVsExpense || []} xKey="month"
          series={[{ key: "collection", color: "#16a34a" }, { key: "expense", color: "#dc2626" }]} />
        <ChartCard title="Payment Mode Split" type="pie" data={modes} xKey="name" dataKey="value" />
      </div>
    </AppShell>
  );
}
