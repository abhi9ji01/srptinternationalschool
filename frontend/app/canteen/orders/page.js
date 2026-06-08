"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime, statusColor } from "@/lib/utils";

export default function CanteenOrdersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/canteen/orders");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function complete(id) {
    try {
      await api.post(`/canteen/orders/${id}/status`, { status: "completed" });
      toast.success("Order completed");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "customer_name", header: "Customer" },
    { key: "total_amount", header: "Total", render: (r) => formatCurrency(r.total_amount) },
    { key: "payment_mode", header: "Payment" },
    { key: "order_date", header: "Date", render: (r) => formatDateTime(r.order_date) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex justify-end">
          {r.status === "pending" && <Button size="sm" onClick={() => complete(r.id)}>Complete</Button>}
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Canteen Orders" allow={["super_admin", "admin", "canteen_manager"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No orders yet" />
      </CardContent></Card>
    </AppShell>
  );
}
