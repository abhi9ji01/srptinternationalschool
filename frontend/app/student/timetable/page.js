"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentTimetablePage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSection, setHasSection] = useState(true);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        const secId = d?.student?.section_id;
        if (!secId) { setHasSection(false); setLoading(false); return; }
        try {
          const res = await api.get(`/timetable?section_id=${secId}`);
          setPeriods(Array.isArray(res) ? res : (res.data || []));
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const cellFor = (period, day) =>
    periods.find((p) => Number(p.period_number) === period && p.day_of_week === day);

  return (
    <AppShell title="My Timetable" allow={["super_admin", "admin", "student"]}>
      <Card>
        <CardHeader><CardTitle className="text-base">Weekly Schedule</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !hasSection ? (
            <EmptyState title="No section assigned" description="You are not assigned to any section yet." />
          ) : periods.length === 0 ? (
            <EmptyState title="No timetable" description="Your timetable has not been published yet." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Period</TableHead>
                    {DAYS.map((d) => (
                      <TableHead key={d} className={cn(d === today && "bg-green-100 text-green-700")}>
                        {d}{d === today && <span className="ml-1 text-[10px] font-normal">(Today)</span>}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERIODS.map((period) => (
                    <TableRow key={period}>
                      <TableCell className="font-medium">P{period}</TableCell>
                      {DAYS.map((day) => {
                        const c = cellFor(period, day);
                        return (
                          <TableCell key={day} className={cn(day === today && "bg-green-50")}>
                            {c ? (
                              <div>
                                <p className="font-medium">{c.subject_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{c.teacher_name || ""}</p>
                                {c.start_time && <p className="text-xs text-muted-foreground">{String(c.start_time).slice(0, 5)}</p>}
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
