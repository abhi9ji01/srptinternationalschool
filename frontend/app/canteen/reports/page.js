"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function CanteenReportsPage() {
  const [d, setD] = useState({});
  useEffect(() => { api.get("/canteen/dashboard").then(setD).catch((e) => toast.error(e.message)); }, []);

  return (
    <AppShell title="Canteen Reports" allow={["super_admin", "admin", "canteen_manager"]}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Orders Today" value={d?.orders_today ?? "—"} icon="ShoppingBag" />
        <StatCard title="Revenue Today" value={formatCurrency(d?.revenue_today)} icon="IndianRupee" color="text-green-600" />
      </div>
    </AppShell>
  );
}
