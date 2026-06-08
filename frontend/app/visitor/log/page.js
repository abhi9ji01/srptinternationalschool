"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function VisitorLogPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/visitors");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "purpose", header: "Purpose" },
    { key: "whom_to_meet", header: "Whom to Meet" },
    { key: "in_time", header: "In Time", render: (r) => formatDateTime(r.in_time) },
    { key: "out_time", header: "Out Time", render: (r) => (r.out_time ? formatDateTime(r.out_time) : "Inside") },
    { key: "pass_number", header: "Pass" },
  ];

  return (
    <AppShell title="Visitor Log" allow={["super_admin", "admin", "security_guard"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No visitor records" />
      </CardContent></Card>
    </AppShell>
  );
}
