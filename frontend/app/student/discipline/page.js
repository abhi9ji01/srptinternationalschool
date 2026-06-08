"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function StudentDisciplinePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get(`/discipline?student_id=${d.studentId}`);
          setRecords(Array.isArray(res) ? res : (res.data || []));
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const columns = [
    { key: "incident_date", header: "Date", render: (r) => formatDate(r.incident_date) },
    { key: "type", header: "Type", render: (r) => (
      <Badge variant="secondary" className={r.type === "positive" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {r.type || "—"}
      </Badge>
    ) },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
    { key: "action_taken", header: "Action Taken" },
  ];

  return (
    <AppShell title="Discipline Records" allow={["super_admin", "admin", "student"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={records} loading={loading} emptyTitle="No discipline records" />
      </CardContent></Card>
    </AppShell>
  );
}
