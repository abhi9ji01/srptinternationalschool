"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { api } from "@/lib/api";

export default function HealthReportsPage() {
  const [d, setD] = useState({});
  useEffect(() => { api.get("/health/dashboard").then(setD).catch((e) => toast.error(e.message)); }, []);

  return (
    <AppShell title="Health Reports" allow={["super_admin", "admin", "health_officer"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's Visits" value={d?.today_visits ?? "—"} icon="Stethoscope" />
        <StatCard title="Health Records" value={d?.records ?? "—"} icon="ClipboardList" color="text-green-600" />
        <StatCard title="Follow-ups" value={d?.followups ?? "—"} icon="CalendarCheck" color="text-amber-600" />
      </div>
    </AppShell>
  );
}
