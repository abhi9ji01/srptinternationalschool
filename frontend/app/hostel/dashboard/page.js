"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { api } from "@/lib/api";

export default function HostelDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/hostel/dashboard").then(setD).catch(() => {}); }, []);
  return (
    <AppShell title="Hostel Dashboard" allow={["super_admin", "admin", "hostel_warden"]}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Hostels" value={d?.hostels ?? "—"} icon="Building" />
        <StatCard title="Rooms" value={d?.rooms ?? "—"} icon="DoorOpen" color="text-green-600" />
        <StatCard title="Occupied" value={d?.occupied ?? "—"} icon="Users" color="text-amber-600" />
      </div>
    </AppShell>
  );
}
