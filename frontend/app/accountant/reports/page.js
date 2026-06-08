"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function FinanceReportsPage() {
  const [summary, setSummary] = useState({ total_collected: 0, total_pending: 0, total_expense: 0 });
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/reports/finance");
      setSummary(d.summary || { total_collected: 0, total_pending: 0, total_expense: 0 });
      setExpensesByCategory(Array.isArray(d.expensesByCategory) ? d.expensesByCategory : []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function exportExcel() {
    setExporting(true);
    try {
      await api.download("/reports/finance/export", "finance_report.xlsx");
    } catch (e) { toast.error(e.message); }
    setExporting(false);
  }

  const columns = [
    { key: "category", header: "Category" },
    { key: "total", header: "Total", render: (r) => formatCurrency(r.total) },
  ];

  return (
    <AppShell title="Finance Reports" allow={ALLOW}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Collected" value={formatCurrency(summary.total_collected)} icon="TrendingUp" color="text-green-600" />
          <StatCard title="Total Pending" value={formatCurrency(summary.total_pending)} icon="Clock" color="text-yellow-600" />
          <StatCard title="Total Expense" value={formatCurrency(summary.total_expense)} icon="TrendingDown" color="text-red-600" />
        </div>

        <Card><CardContent className="pt-6">
          <DataTable
            columns={columns} data={expensesByCategory} loading={loading} searchable={false}
            emptyTitle="No expenses by category"
            actions={
              <Button onClick={exportExcel} disabled={exporting}>
                <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            }
          />
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
