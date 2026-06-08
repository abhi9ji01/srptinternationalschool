"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function ParentTransportPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get("/reports/dashboard/parent");
        const kids = d.children || [];
        setChildren(kids);
        if (kids.length) setActiveId(kids[0].id);
        else setLoading(false);
      } catch (e) {
        toast.error(e.message);
        setLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async (sid) => {
    setLoading(true);
    try {
      const d = await api.get(`/transport/my?student_id=${sid}`);
      setTransport(d || null);
    } catch (e) {
      toast.error(e.message);
      setTransport(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const fields = transport ? [
    ["Route", transport.route_name],
    ["Vehicle Number", transport.vehicle_number],
    ["Driver", transport.driver_name],
    ["Driver Phone", transport.driver_phone],
    ["Pickup Stop", transport.pickup_stop],
    ["Drop Stop", transport.drop_stop],
    ["Pickup Time", transport.pickup_time],
    ["Drop Time", transport.drop_time],
  ] : [];

  return (
    <AppShell title="Transport" allow={["super_admin", "admin", "parent"]}>
      {children.length === 0 && !loading ? (
        <EmptyState title="No children linked" description="Contact the school to link your child's account." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <Button key={c.id} variant={c.id === activeId ? "default" : "outline"} size="sm" onClick={() => setActiveId(c.id)}>
                {c.name}
              </Button>
            ))}
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : !transport ? (
            <EmptyState title="No transport assigned" description="This child is not assigned to any transport route." />
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Transport Details</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {fields.map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm border-b pb-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-right">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
