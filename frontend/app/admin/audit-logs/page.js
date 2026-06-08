"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get("/audit-logs");
        setRows(Array.isArray(d) ? d : d.data || []);
      } catch (e) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, []);

  async function exportExcel() {
    try {
      await api.download("/audit-logs/export", "audit_logs.xlsx");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const columns = [
    { key: "created_at", header: "Time", render: (r) => formatDateTime(r.created_at) },
    { key: "user_name", header: "User" },
    { key: "action", header: "Action" },
    { key: "module", header: "Module" },
    { key: "record_id", header: "Record ID" },
    { key: "ip_address", header: "IP Address" },
  ];

  return (
    <AppShell title="Audit Logs" allow={["super_admin", "admin"]}>
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            emptyTitle="No audit logs yet"
            actions={
              <Button variant="outline" onClick={exportExcel}>
                <Download className="h-4 w-4" /> Export Excel
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
