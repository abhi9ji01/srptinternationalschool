"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function VisitorDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/visitors/dashboard").then(setD).catch(() => {}); }, []);
  return (
    <AppShell title="Visitor Management" allow={["super_admin", "admin", "security_guard"]}>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <StatCard title="Today's Visitors" value={d?.total_today ?? "—"} icon="UserCheck" />
        <StatCard title="Currently Inside" value={d?.inside ?? "—"} icon="Users" color="text-green-600" />
      </div>
      <div className="flex gap-2">
        <Button asChild><Link href="/visitor/checkin">New Check-in</Link></Button>
        <Button asChild variant="outline"><Link href="/visitor/log">View Log</Link></Button>
      </div>
    </AppShell>
  );
}
