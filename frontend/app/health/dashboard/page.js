"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { api } from "@/lib/api";

export default function HealthDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/health/dashboard").then(setD).catch(() => {}); }, []);
  return (
    <AppShell title="Health Dashboard" allow={["super_admin", "admin", "health_officer"]}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Today's Visits" value={d?.today_visits ?? "—"} icon="Stethoscope" />
        <StatCard title="Health Records" value={d?.records ?? "—"} icon="HeartPulse" color="text-green-600" />
        <StatCard title="Follow-ups" value={d?.followups ?? "—"} icon="CalendarClock" color="text-amber-600" />
      </div>
    </AppShell>
  );
}
