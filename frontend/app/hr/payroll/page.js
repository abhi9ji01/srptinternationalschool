"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, statusColor } from "@/lib/utils";

const now = new Date();

export default function HrPayrollPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get(`/hr/payroll?month=${month}&year=${year}`);
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setGenerating(true);
    try {
      const res = await api.post("/hr/payroll/generate", { month, year });
      toast.success(`Generated ${res.generated} payroll records`);
      load();
    } catch (e) { toast.error(e.message); }
    setGenerating(false);
  }

  async function markPaid(id) {
    try {
      await api.post(`/hr/payroll/${id}/pay`, { payment_mode: "bank" });
      toast.success("Marked paid");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "staff_name", header: "Staff" },
    { key: "employee_id", header: "Emp ID" },
    { key: "basic_salary", header: "Basic", render: (r) => formatCurrency(r.basic_salary) },
    { key: "net_salary", header: "Net", render: (r) => formatCurrency(r.net_salary) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex gap-1 justify-end items-center">
          {r.status !== "paid" && <Button size="sm" onClick={() => markPaid(r.id)}>Mark Paid</Button>}
          <Link href={`/hr/payroll/${r.id}/slip`} className="text-sm text-primary underline px-2">Slip</Link>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Payroll" allow={["super_admin", "admin", "hr_manager"]}>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className="w-28" />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-32" />
          </div>
          <Button onClick={load} variant="outline">Load</Button>
          <Button onClick={generate} disabled={generating} className="ml-auto">{generating ? "Generating..." : "Generate Payroll"}</Button>
        </CardContent>
      </Card>

      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No payroll records" />
      </CardContent></Card>
    </AppShell>
  );
}
