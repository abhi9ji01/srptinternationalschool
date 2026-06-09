"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherTimetablePage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dash = await api.get("/reports/dashboard/teacher");
        const teacherId = dash?.teacherId;
        if (!teacherId) { setPeriods([]); setLoading(false); return; }
        const data = await api.get(`/timetable?teacher_id=${teacherId}`);
        setPeriods(Array.isArray(data) ? data : data.data || []);
      } catch (e) {
        setPeriods([]);
      }
      setLoading(false);
    })();
  }, []);

  function cellFor(period, day) {
    return periods.find((p) => Number(p.period_number) === period && p.day_of_week === day);
  }

  return (
    <AppShell title="My Timetable" allow={["super_admin", "admin", "teacher"]}>
      <Card>
        <CardHeader><CardTitle className="text-base">Weekly Schedule</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : periods.length === 0 ? (
            <EmptyState title="No timetable" description="No periods are assigned to you yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border bg-muted p-2 text-left font-medium">Period</th>
                    {DAYS.map((d) => (
                      <th key={d} className={cn("border p-2 text-left font-medium", d === today ? "bg-green-100 text-green-700" : "bg-muted")}>
                        {d}{d === today && <span className="ml-1 text-[10px] font-normal">(Today)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((p) => (
                    <tr key={p}>
                      <td className="border p-2 font-medium whitespace-nowrap">Period {p}</td>
                      {DAYS.map((d) => {
                        const c = cellFor(p, d);
                        return (
                          <td key={d} className={cn("border p-2 align-top", d === today && "bg-green-50")}>
                            {c ? (
                              <div>
                                <p className="font-medium">{c.subject_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{c.class_name} {c.section_name}</p>
                                {c.start_time && <p className="text-xs text-muted-foreground">{c.start_time.slice(0, 5)}</p>}
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
