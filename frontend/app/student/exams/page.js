"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function StudentExamsPage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        const secId = d?.student?.section_id;
        if (!secId) { setLoading(false); return; }
        try {
          const res = await api.get(`/exams/schedule?section_id=${secId}`);
          setSchedule(Array.isArray(res) ? res : (res.data || []));
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const columns = [
    { key: "subject_name", header: "Subject" },
    { key: "exam_type", header: "Type", render: (r) => <Badge variant="outline">{r.exam_type || "—"}</Badge> },
    { key: "exam_date", header: "Date", render: (r) => formatDate(r.exam_date) },
    { key: "start_time", header: "Start", render: (r) => (r.start_time ? String(r.start_time).slice(0, 5) : "—") },
    { key: "end_time", header: "End", render: (r) => (r.end_time ? String(r.end_time).slice(0, 5) : "—") },
    { key: "room_number", header: "Room" },
  ];

  return (
    <AppShell title="Exam Schedule" allow={["super_admin", "admin", "student"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={schedule} loading={loading} emptyTitle="No exams scheduled" />
      </CardContent></Card>
    </AppShell>
  );
}
