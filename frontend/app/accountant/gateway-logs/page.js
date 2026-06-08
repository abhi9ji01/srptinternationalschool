"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function GatewayLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/fees/gateway-logs");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "id", header: "ID" },
    { key: "gateway", header: "Gateway" },
    { key: "order_id", header: "Order ID" },
    { key: "payment_id", header: "Payment ID" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "status", header: "Status" },
    { key: "created_at", header: "Created", render: (r) => formatDateTime(r.created_at) },
  ];

  return (
    <AppShell title="Gateway Logs" allow={ALLOW}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No gateway logs" />
      </CardContent></Card>
    </AppShell>
  );
}
