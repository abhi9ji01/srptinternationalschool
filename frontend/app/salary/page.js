"use client";
import { useEffect, useMemo, useState } from "react";
import { Printer, Wallet } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency, statusColor } from "@/lib/utils";

// Every employee role may view their OWN salary. HR/admins manage everyone via /hr/payroll.
const ALLOW = [
  "super_admin", "admin", "teacher", "accountant", "librarian", "transport_manager",
  "hostel_warden", "hr_manager", "security_guard", "canteen_manager", "health_officer",
];

const MONTHS = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const monthLabel = (m, y) => `${MONTHS[Number(m)] || m} ${y}`;
const maskAccount = (a) => (a ? `••••${String(a).slice(-4)}` : "—");

export default function SalaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    api.get("/hr/my-salary")
      .then(setData)
      .catch(() => setData({ staff: null, payroll: [] }))
      .finally(() => setLoading(false));
  }, []);

  const staff = data?.staff;
  const payroll = data?.payroll || [];
  const slip = payroll[sel];

  const earnings = useMemo(() => slip ? [
    { label: "Basic Salary", value: slip.basic_salary },
    { label: "HRA", value: slip.hra },
    { label: "DA", value: slip.da },
    { label: "Other Allowances", value: slip.other_allowances },
  ] : [], [slip]);

  const deductions = useMemo(() => slip ? [
    { label: "Provident Fund (PF)", value: slip.pf },
    { label: "ESI", value: slip.esi },
    { label: "TDS", value: slip.tds },
    { label: `Loss of Pay (${slip.lop_days || 0} days)`, value: slip.lop_deduction },
  ] : [], [slip]);

  const gross = earnings.reduce((s, e) => s + Number(e.value || 0), 0);
  const totalDeductions = deductions.reduce((s, d) => s + Number(d.value || 0), 0);

  return (
    <AppShell title="My Salary" allow={ALLOW}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !staff ? (
        <EmptyState title="No salary record" description="No employee/salary record is linked to your account yet. Contact HR." />
      ) : (
        <div className="space-y-4 print:space-y-2">
          {/* Employee header */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{staff.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {staff.designation || "—"}{staff.department ? ` · ${staff.department}` : ""}
                    {staff.employee_id ? ` · ${staff.employee_id}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Monthly Base</p>
                <p className="text-xl font-bold">{formatCurrency(staff.basic_salary)}</p>
              </div>
            </CardContent>
          </Card>

          {payroll.length === 0 ? (
            <EmptyState title="No payslips yet" description="Your monthly payslips will appear here once HR generates payroll." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Breakdown of the selected payslip */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Payslip — {slip && monthLabel(slip.month, slip.year)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor(slip?.status)} variant="outline">{slip?.status || "pending"}</Badge>
                    <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-green-600">Earnings</p>
                      <BreakdownRows rows={earnings} />
                      <Row label="Gross" value={gross} strong />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-red-600">Deductions</p>
                      <BreakdownRows rows={deductions} />
                      <Row label="Total Deductions" value={totalDeductions} strong />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between rounded-lg bg-muted p-4">
                    <span className="font-semibold">Net Pay</span>
                    <span className="text-2xl font-bold">{formatCurrency(slip?.net_salary)}</span>
                  </div>
                  {slip?.status === "paid" && slip?.payment_date && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Paid on {slip.payment_date} {slip.payment_mode ? `via ${slip.payment_mode}` : ""}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Bank A/C: {maskAccount(staff.bank_account)}</span>
                    <span>PAN: {staff.pan_number || "—"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payslip history */}
              <Card className="print:hidden">
                <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.map((p, i) => (
                        <TableRow
                          key={p.id}
                          onClick={() => setSel(i)}
                          className={`cursor-pointer ${i === sel ? "bg-accent" : ""}`}
                        >
                          <TableCell className="font-medium">{monthLabel(p.month, p.year)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.net_salary)}</TableCell>
                          <TableCell><Badge className={statusColor(p.status)} variant="outline">{p.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function BreakdownRows({ rows }) {
  return (
    <div className="space-y-1.5">
      {rows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex items-center justify-between border-t py-1.5 text-sm ${strong ? "mt-1 font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
