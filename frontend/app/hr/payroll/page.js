"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Banknote, Wallet, Clock } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, statusColor } from "@/lib/utils";

const now = new Date();
const today = now.toISOString().slice(0, 10);

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
];
const methodLabel = (v) => PAYMENT_METHODS.find((m) => m.value === v)?.label || v || "—";

export default function HrPayrollPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Pay dialog: target is a single row, or "all" for bulk.
  const [payTarget, setPayTarget] = useState(null);
  const [payMode, setPayMode] = useState("cash");
  const [payDate, setPayDate] = useState(today);
  const [paying, setPaying] = useState(false);

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

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.net_salary || 0), 0);
    const paidRows = rows.filter((r) => r.status === "paid");
    const paid = paidRows.reduce((s, r) => s + Number(r.net_salary || 0), 0);
    return { total, paid, pending: total - paid, pendingCount: rows.length - paidRows.length };
  }, [rows]);

  function openPay(target) {
    setPayTarget(target);
    setPayMode("cash");
    setPayDate(today);
  }

  async function confirmPay() {
    setPaying(true);
    try {
      if (payTarget === "all") {
        const res = await api.post("/hr/payroll/pay-all", { month, year, payment_mode: payMode, payment_date: payDate });
        toast.success(`Paid ${res.paid} payslip(s)`);
      } else {
        await api.post(`/hr/payroll/${payTarget.id}/pay`, { payment_mode: payMode, payment_date: payDate });
        toast.success("Marked paid");
      }
      setPayTarget(null);
      load();
    } catch (e) { toast.error(e.message); }
    setPaying(false);
  }

  const columns = [
    { key: "staff_name", header: "Staff" },
    { key: "employee_id", header: "Emp ID" },
    { key: "department", header: "Dept" },
    { key: "basic_salary", header: "Basic", render: (r) => formatCurrency(r.basic_salary) },
    { key: "net_salary", header: "Net", render: (r) => <span className="font-medium">{formatCurrency(r.net_salary)}</span> },
    { key: "payment_mode", header: "Method", render: (r) => (r.status === "paid" ? methodLabel(r.payment_mode) : "—") },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status !== "paid" && <Button size="sm" onClick={() => openPay(r)}>Pay</Button>}
          <Link href={`/hr/payroll/${r.id}/slip`} className="px-2 text-sm text-primary underline">Slip</Link>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Payroll" allow={["super_admin", "admin", "hr_manager"]}>
      {/* Controls */}
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
          <div className="ml-auto flex gap-2">
            <Button onClick={() => openPay("all")} variant="outline" disabled={summary.pendingCount === 0}>
              Pay All Pending ({summary.pendingCount})
            </Button>
            <Button onClick={generate} disabled={generating}>{generating ? "Generating..." : "Generate Payroll"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Banknote} label="Total Payroll" value={formatCurrency(summary.total)} />
        <StatCard icon={Wallet} label="Paid" value={formatCurrency(summary.paid)} color="text-green-600" />
        <StatCard icon={Clock} label="Pending" value={formatCurrency(summary.pending)} color="text-amber-600" />
      </div>

      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No payroll records" />
      </CardContent></Card>

      {/* Pay dialog (single + bulk) */}
      <Dialog open={!!payTarget} onOpenChange={(v) => !v && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {payTarget === "all"
                ? `Pay all pending (${summary.pendingCount}) — ${formatCurrency(summary.pending)}`
                : `Pay ${payTarget?.staff_name} — ${formatCurrency(payTarget?.net_salary)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payMode} onValueChange={setPayMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={confirmPay} disabled={paying}>{paying ? "Processing..." : "Confirm Payment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className={`grid h-10 w-10 place-items-center rounded-full bg-muted ${color || ""}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${color || ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
