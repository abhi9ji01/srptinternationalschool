"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate, statusColor } from "@/lib/utils";

export default function HrLeavesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/hr/leaves");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id, status) {
    try {
      await api.post(`/hr/leaves/${id}/decision`, { status });
      toast.success(`Leave ${status}`);
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "staff_name", header: "Staff" },
    { key: "leave_type", header: "Type" },
    { key: "from_date", header: "From", render: (r) => formatDate(r.from_date) },
    { key: "to_date", header: "To", render: (r) => formatDate(r.to_date) },
    { key: "total_days", header: "Days" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex gap-1 justify-end">
          {r.status === "pending" && (
            <>
              <Button size="sm" onClick={() => decide(r.id, "approved")}>Approve</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => decide(r.id, "rejected")}>Reject</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Leave Applications" allow={["super_admin", "admin", "hr_manager"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No leave applications" />
      </CardContent></Card>
    </AppShell>
  );
}
