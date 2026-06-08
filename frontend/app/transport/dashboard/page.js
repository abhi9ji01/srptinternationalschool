"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function TransportDashboard() {
  const [d, setD] = useState(null);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    api.get("/transport/dashboard").then(setD).catch(() => {});
    api.get("/transport/expiry-alerts").then(setAlerts).catch(() => {});
  }, []);
  return (
    <AppShell title="Transport Dashboard" allow={["super_admin", "admin", "transport_manager"]}>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="Vehicles" value={d?.vehicles ?? "—"} icon="Bus" />
        <StatCard title="Routes" value={d?.routes ?? "—"} icon="Map" color="text-green-600" />
        <StatCard title="Students" value={d?.students ?? "—"} icon="GraduationCap" color="text-amber-600" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Insurance / Fitness Expiry Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 ? <EmptyState title="No upcoming expiries" /> :
            alerts.map((v) => (
              <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                <span className="font-medium">{v.vehicle_number}</span>
                <div className="flex gap-2">
                  <Badge variant={v.insurance_days < 30 ? "destructive" : "outline"}>Ins: {formatDate(v.insurance_expiry)}</Badge>
                  <Badge variant={v.fitness_days < 30 ? "destructive" : "outline"}>Fit: {formatDate(v.fitness_expiry)}</Badge>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
