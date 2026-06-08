"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ParentTimetablePage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [periods, setPeriods] = useState([]);
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
      const stu = await api.get(`/students/${sid}`);
      const sectionId = stu?.section_id;
      if (!sectionId) { setPeriods([]); setLoading(false); return; }
      const d = await api.get(`/timetable?section_id=${sectionId}`);
      setPeriods(Array.isArray(d) ? d : (d?.data || []));
    } catch (e) {
      toast.error(e.message);
      setPeriods([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  function cellFor(day, period) {
    return periods.find((p) => p.day_of_week === day && Number(p.period_number) === period);
  }

  return (
    <AppShell title="Timetable" allow={["super_admin", "admin", "parent"]}>
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
            <Skeleton className="h-96 w-full" />
          ) : periods.length === 0 ? (
            <EmptyState title="No timetable available" description="The timetable for this section has not been published yet." />
          ) : (
            <Card><CardContent className="pt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted text-left">Period</th>
                    {DAYS.map((d) => <th key={d} className="border p-2 bg-muted text-left">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((pn) => (
                    <tr key={pn}>
                      <td className="border p-2 font-medium bg-muted/40">Period {pn}</td>
                      {DAYS.map((day) => {
                        const cell = cellFor(day, pn);
                        return (
                          <td key={day} className="border p-2 align-top">
                            {cell ? (
                              <div>
                                <div className="font-medium">{cell.subject_name || "—"}</div>
                                {cell.teacher_name && <div className="text-xs text-muted-foreground">{cell.teacher_name}</div>}
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
