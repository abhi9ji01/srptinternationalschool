"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function ParentAttendancePage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [report, setReport] = useState(null);
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
      const d = await api.get(`/attendance/report?student_id=${sid}`);
      setReport(d || {});
    } catch (e) {
      toast.error(e.message);
      setReport({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const summary = report?.summary || {};
  const monthly = (report?.monthly || []).map((m) => ({ month: m.month, present: Number(m.present || 0), total: Number(m.total || 0) }));

  return (
    <AppShell title="Attendance" allow={["super_admin", "admin", "parent"]}>
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
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Attendance %" value={`${report?.percent ?? 0}%`} icon="Percent" color="text-blue-600" />
                <StatCard title="Present" value={Number(summary.present || 0)} icon="CheckCircle" color="text-green-600" />
                <StatCard title="Absent" value={Number(summary.absent || 0)} icon="XCircle" color="text-red-600" />
                <StatCard title="Total Days" value={Number(summary.total || 0)} icon="CalendarDays" color="text-purple-600" />
              </div>
              <ChartCard title="Monthly Present Days" type="bar" data={monthly} xKey="month" dataKey="present" />
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
