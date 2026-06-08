"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { api } from "@/lib/api";

export default function HostelReportsPage() {
  const [d, setD] = useState({});
  useEffect(() => { api.get("/hostel/dashboard").then(setD).catch((e) => toast.error(e.message)); }, []);

  return (
    <AppShell title="Hostel Reports" allow={["super_admin", "admin", "hostel_warden"]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Hostels" value={d?.hostels ?? "—"} icon="Building2" />
        <StatCard title="Rooms" value={d?.rooms ?? "—"} icon="DoorOpen" color="text-green-600" />
        <StatCard title="Occupied" value={d?.occupied ?? "—"} icon="Users" color="text-amber-600" />
      </div>
    </AppShell>
  );
}
