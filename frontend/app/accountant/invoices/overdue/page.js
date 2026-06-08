"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function OverdueInvoicesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/fees/invoices/overdue");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function notifyAll() {
    setNotifying(true);
    try {
      const res = await api.post("/fees/invoices/notify-overdue");
      toast.success(`Notified ${res.notified ?? 0} overdue invoice(s)`);
    } catch (e) { toast.error(e.message); }
    setNotifying(false);
  }

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "category_name", header: "Category" },
    { key: "balance", header: "Balance", render: (r) => formatCurrency(r.balance) },
    { key: "due_date", header: "Due Date", render: (r) => formatDate(r.due_date) },
  ];

  return (
    <AppShell title="Overdue Invoices" allow={ALLOW}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No overdue invoices"
          actions={<Button onClick={notifyAll} disabled={notifying}>{notifying ? "Notifying..." : "Notify All Overdue"}</Button>}
        />
      </CardContent></Card>
    </AppShell>
  );
}
