"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import ChartCard from "@/components/shared/ChartCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function StudentMarksPage() {
  const [marks, setMarks] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        setTrend(d?.marksTrend || []);
        try {
          const res = await api.get(`/students/${d.studentId}/report-card`);
          const arr = (res?.marks || []).filter((m) => !m.is_absent);
          setMarks(res?.marks || []);
          // Build per-exam percentage trend if dashboard trend is empty.
          if (!(d?.marksTrend || []).length) {
            setTrend(arr.map((m) => ({
              exam: m.exam_name,
              pct: m.total_marks ? Math.round((Number(m.marks_obtained || 0) / Number(m.total_marks)) * 1000) / 10 : 0,
            })));
          }
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const columns = [
    { key: "subject_name", header: "Subject" },
    { key: "exam_name", header: "Exam" },
    { key: "marks_obtained", header: "Obtained", render: (r) => (r.is_absent ? "AB" : (r.marks_obtained ?? "—")) },
    { key: "total_marks", header: "Total" },
    { key: "grade", header: "Grade", render: (r) => <Badge variant="secondary">{r.grade || "—"}</Badge> },
  ];

  return (
    <AppShell title="My Marks" allow={["super_admin", "admin", "student"]}>
      <div className="space-y-4">
        <Card><CardContent className="pt-6">
          <DataTable columns={columns} data={marks} loading={loading} emptyTitle="No marks available" />
        </CardContent></Card>
        <ChartCard title="Performance Trend (%)" type="line" data={trend} xKey="exam" dataKey="pct" />
      </div>
    </AppShell>
  );
}
