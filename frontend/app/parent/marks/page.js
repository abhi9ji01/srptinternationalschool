"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { statusColor } from "@/lib/utils";

export default function ParentMarksPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [marks, setMarks] = useState([]);
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
      const d = await api.get(`/students/${sid}/report-card`);
      setMarks(d?.marks || []);
    } catch (e) {
      toast.error(e.message);
      setMarks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const columns = [
    { key: "subject_name", header: "Subject" },
    { key: "exam_name", header: "Exam" },
    { key: "marks_obtained", header: "Marks", render: (r) => (r.is_absent ? "Absent" : (r.marks_obtained ?? "—")) },
    { key: "total_marks", header: "Total" },
    { key: "grade", header: "Grade", render: (r) => r.grade ? <Badge className={statusColor(String(r.grade).toLowerCase())} variant="secondary">{r.grade}</Badge> : "—" },
  ];

  // per-exam percentage trend
  const trend = marks
    .filter((m) => !m.is_absent && Number(m.total_marks) > 0)
    .map((m) => ({
      exam: m.exam_name,
      percentage: Math.round((Number(m.marks_obtained || 0) / Number(m.total_marks)) * 10000) / 100,
    }));

  return (
    <AppShell title="Marks" allow={["super_admin", "admin", "parent"]}>
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

          <Card><CardContent className="pt-6">
            <DataTable columns={columns} data={marks} loading={loading} emptyTitle="No marks recorded" />
          </CardContent></Card>

          {trend.length > 0 && <ChartCard title="Performance by Exam (%)" type="line" data={trend} xKey="exam" dataKey="percentage" />}
        </div>
      )}
    </AppShell>
  );
}
