"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Bus } from "lucide-react";
import { api } from "@/lib/api";

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function StudentTransportPage() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get(`/transport/my?student_id=${d.studentId}`);
          setInfo(res || null);
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  return (
    <AppShell title="My Transport" allow={["super_admin", "admin", "student"]}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bus className="h-4 w-4 text-primary" /> Transport Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : !info ? (
            <EmptyState title="No transport assigned" description="You have not been assigned to a transport route." />
          ) : (
            <div>
              <Row label="Route" value={info.route_name} />
              <Row label="Stops" value={info.stops} />
              <Row label="Pickup Stop" value={info.pickup_stop} />
              <Row label="Drop Stop" value={info.drop_stop} />
              <Row label="Vehicle Number" value={info.vehicle_number} />
              <Row label="Driver Name" value={info.driver_name} />
              <Row label="Driver Phone" value={info.driver_phone} />
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
