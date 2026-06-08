"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function ParentHostelPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [allocation, setAllocation] = useState(null);
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
      const d = await api.get("/hostel/students");
      const list = Array.isArray(d) ? d : (d?.data || []);
      const match = list.find((row) => Number(row.student_id) === Number(sid)) || null;
      setAllocation(match);
    } catch {
      // endpoint may 403 for parents — treat as no allocation visible
      setAllocation(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  return (
    <AppShell title="Hostel" allow={["super_admin", "admin", "parent"]}>
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
            <Skeleton className="h-48 w-full" />
          ) : !allocation ? (
            <EmptyState title="No hostel allocation" description="This child does not have an active hostel allocation." />
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Hostel Allocation</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  <div className="flex justify-between text-sm border-b pb-2">
                    <dt className="text-muted-foreground">Hostel</dt>
                    <dd className="font-medium text-right">{allocation.hostel_name || "—"}</dd>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <dt className="text-muted-foreground">Room Number</dt>
                    <dd className="font-medium text-right">{allocation.room_number || "—"}</dd>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium text-right">{allocation.status || "—"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
