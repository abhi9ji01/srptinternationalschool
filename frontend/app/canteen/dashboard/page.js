"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function CanteenDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/canteen/dashboard").then(setD).catch(() => {}); }, []);
  return (
    <AppShell title="Canteen Dashboard" allow={["super_admin", "admin", "canteen_manager"]}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Orders Today" value={d?.orders_today ?? "—"} icon="ShoppingCart" />
        <StatCard title="Revenue Today" value={formatCurrency(d?.revenue_today)} icon="Wallet" color="text-green-600" />
      </div>
    </AppShell>
  );
}
