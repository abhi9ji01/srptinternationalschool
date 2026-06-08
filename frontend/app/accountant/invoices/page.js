"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];
const STATUSES = ["all", "pending", "partial", "paid", "overdue"];

export default function InvoicesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");

  const load = useCallback(async (st) => {
    setLoading(true);
    try {
      const path = st && st !== "all" ? `/fees/invoices?status=${st}` : "/fees/invoices";
      const d = await api.get(path);
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(status); }, [load, status]);

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "category_name", header: "Category" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "paid_amount", header: "Paid", render: (r) => formatCurrency(r.paid_amount) },
    { key: "balance", header: "Balance", render: (r) => formatCurrency(r.balance) },
    { key: "due_date", header: "Due Date", render: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)} variant="secondary">{r.status}</Badge> },
  ];

  return (
    <AppShell title="Invoices" allow={ALLOW}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No invoices"
          actions={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
