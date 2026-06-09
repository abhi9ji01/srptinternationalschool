"use client";
import { useEffect, useMemo, useState } from "react";
import { Printer, Wallet, TrendingUp, TrendingDown, Banknote } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const ALLOW = [
  "super_admin", "admin", "teacher", "accountant", "librarian", "transport_manager",
  "hostel_warden", "hr_manager", "security_guard", "canteen_manager", "health_officer",
];
const MONTHS = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const monthLabel = (m, y) => `${MONTHS[Number(m)] || m} ${y}`;
const PAY_LABEL = { cash: "Cash", bank_transfer: "Bank Transfer", upi: "UPI", cheque: "Cheque", bank: "Bank Transfer" };
const maskAccount = (a) => (a ? `••••${String(a).slice(-4)}` : "—");

// Derive a full CTC structure from a single payslip (employer side is computed,
// matching the same rules payroll generation uses).
function buildStructure(slip) {
  const n = (v) => Number(v || 0);
  const basic = n(slip.basic_salary), hra = n(slip.hra), da = n(slip.da), other = n(slip.other_allowances);
  const gross = basic + hra + da + other;
  const pf = n(slip.pf), esi = n(slip.esi), tds = n(slip.tds), lop = n(slip.lop_deduction);
  const deductions = pf + esi + tds + lop;
  const employerPF = pf;                                         // employer matches employee PF
  const employerESI = basic <= 21000 ? Math.round(gross * 0.0325) : 0;
  const compliances = employerPF + employerESI;
  const ctc = gross + compliances;
  const net = n(slip.net_salary);
  return {
    gross, deductions, compliances, ctc, net,
    earnings: [
      { label: "Basic Salary", v: basic },
      { label: "HRA", v: hra },
      { label: "DA", v: da },
      { label: "Other / Special Allowance", v: other },
    ],
    deductionRows: [
      { label: "Provident Fund (PF)", v: pf },
      { label: "ESI", v: esi },
      { label: "TDS", v: tds },
      { label: `Loss of Pay (${slip.lop_days || 0} days)`, v: lop },
    ],
    complianceRows: [
      { label: "Employer PF", v: employerPF },
      { label: "Employer ESI", v: employerESI },
    ],
  };
}

export default function SalaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    api.get("/hr/my-salary").then(setData).catch(() => setData({ staff: null, payroll: [] })).finally(() => setLoading(false));
  }, []);

  const staff = data?.staff;
  const payroll = data?.payroll || [];
  const slip = payroll[sel];
  const s = useMemo(() => (slip ? buildStructure(slip) : null), [slip]);

  if (loading) {
    return <AppShell title="My Salary" allow={ALLOW}><div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></div></AppShell>;
  }
  if (!staff) {
    return <AppShell title="My Salary" allow={ALLOW}><EmptyState title="No salary record" description="No employee/salary record is linked to your account yet. Contact HR." /></AppShell>;
  }

  return (
    <AppShell title="My Salary" allow={ALLOW}>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-4">
        {/* Employee header */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Wallet className="h-6 w-6" /></div>
              <div>
                <p className="text-lg font-semibold">{staff.name}</p>
                <p className="text-sm text-muted-foreground">
                  {staff.designation || "—"}{staff.department ? ` · ${staff.department}` : ""}{staff.employee_id ? ` · ${staff.employee_id}` : ""}
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
          <Tabs defaultValue="structure">
            <TabsList>
              <TabsTrigger value="structure">Salary Structure</TabsTrigger>
              <TabsTrigger value="payslips">Payslips</TabsTrigger>
            </TabsList>

            {/* ---------- STRUCTURE (Zimyo-style) ---------- */}
            <TabsContent value="structure" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard icon={Banknote} label="Total CTC / mo" value={s.ctc} sub={`${formatCurrency(s.ctc * 12)} / yr`} />
                <SummaryCard icon={TrendingUp} label="Total Earnings / mo" value={s.gross} color="text-green-600" />
                <SummaryCard icon={TrendingDown} label="Total Deductions / mo" value={s.deductions} color="text-red-600" />
                <SummaryCard icon={Wallet} label="Net (In-Hand) / mo" value={s.net} color="text-primary" />
              </div>

              {/* CTC breakdown bar */}
              <Card>
                <CardHeader><CardTitle className="text-base">CTC Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">{formatCurrency(s.ctc)} <span className="text-sm font-normal text-muted-foreground">/ month · {formatCurrency(s.ctc * 12)} / year</span></p>
                  <BreakdownBar earnings={s.gross} deductions={s.deductions} compliances={s.compliances} />
                  <div className="space-y-1 text-sm">
                    <LegendRow color="bg-green-500" label="Earnings" value={s.gross} total={s.gross + s.deductions + s.compliances} />
                    <LegendRow color="bg-red-500" label="Deductions" value={s.deductions} total={s.gross + s.deductions + s.compliances} />
                    <LegendRow color="bg-amber-500" label="Compliances (Employer)" value={s.compliances} total={s.gross + s.deductions + s.compliances} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
                    <span className="flex items-center gap-2 text-sm font-medium"><Wallet className="h-4 w-4" /> In-Hand Salary</span>
                    <span className="text-sm"><span className="font-semibold text-green-600">{formatCurrency(s.net)}/mo</span> · <span className="font-semibold text-primary">{formatCurrency(s.net * 12)}/yr</span></span>
                  </div>
                </CardContent>
              </Card>

              <StructureTable title="Earnings" rows={s.earnings} accent="text-green-600" />
              <div className="grid gap-4 lg:grid-cols-2">
                <StructureTable title="Deductions" rows={s.deductionRows} accent="text-red-600" />
                <StructureTable title="Compliances (Employer Contribution)" rows={s.complianceRows} accent="text-amber-600" />
              </div>
            </TabsContent>

            {/* ---------- PAYSLIPS ---------- */}
            <TabsContent value="payslips">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 print-area">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Payslip — {monthLabel(slip.month, slip.year)}</CardTitle>
                    <div className="flex items-center gap-2 no-print">
                      <Badge variant="outline" className={slip.status === "paid" ? "text-green-600" : "text-amber-600"}>{slip.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 hidden text-center print:block">
                      <p className="text-lg font-bold">{staff.school_name || "School"}</p>
                      <p className="text-sm">Payslip — {monthLabel(slip.month, slip.year)} · {staff.name}</p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-green-600">Earnings</p>
                        {s.earnings.map((r) => <Row key={r.label} label={r.label} value={r.v} />)}
                        <Row label="Gross" value={s.gross} strong />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-red-600">Deductions</p>
                        {s.deductionRows.map((r) => <Row key={r.label} label={r.label} value={r.v} />)}
                        <Row label="Total Deductions" value={s.deductions} strong />
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between rounded-lg bg-muted p-4">
                      <span className="font-semibold">Net Pay</span>
                      <span className="text-2xl font-bold">{formatCurrency(slip.net_salary)}</span>
                    </div>
                    {slip.status === "paid" && slip.payment_date && (
                      <p className="mt-2 text-xs text-muted-foreground">Paid on {slip.payment_date} {slip.payment_mode ? `via ${PAY_LABEL[slip.payment_mode] || slip.payment_mode}` : ""}</p>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Bank A/C: {maskAccount(staff.bank_account)}</span>
                      <span>PAN: {staff.pan_number || "—"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="no-print">
                  <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Month</TableHead><TableHead className="text-right">Net</TableHead><TableHead>Status</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {payroll.map((p, i) => (
                          <TableRow key={p.id} onClick={() => setSel(i)} className={`cursor-pointer ${i === sel ? "bg-accent" : ""}`}>
                            <TableCell className="font-medium">{monthLabel(p.month, p.year)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(p.net_salary)}</TableCell>
                            <TableCell><Badge variant="outline" className={p.status === "paid" ? "text-green-600" : "text-amber-600"}>{p.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg bg-muted ${color || ""}`}><Icon className="h-5 w-5" /></div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${color || ""}`}>{formatCurrency(value)}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BreakdownBar({ earnings, deductions, compliances }) {
  const total = earnings + deductions + compliances || 1;
  const seg = (v, c) => <div className={c} style={{ width: `${(v / total) * 100}%` }} />;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {seg(earnings, "bg-green-500")}
      {seg(deductions, "bg-red-500")}
      {seg(compliances, "bg-amber-500")}
    </div>
  );
}

function LegendRow({ color, label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span>
      <span><span className="font-medium">{formatCurrency(value)}</span> <span className="text-muted-foreground">{pct}%</span></span>
    </div>
  );
}

function StructureTable({ title, rows, accent }) {
  const total = rows.reduce((a, r) => a + Number(r.v || 0), 0);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={`text-base ${accent}`}>{title}</CardTitle>
        <span className="text-xs text-muted-foreground">Monthly {formatCurrency(total)} · Yearly {formatCurrency(total * 12)}</span>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Component</TableHead><TableHead className="text-right">Monthly</TableHead><TableHead className="text-right">Yearly</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.label}>
                <TableCell>{r.label}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.v)}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.v || 0) * 12)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(total)}</TableCell>
              <TableCell className="text-right">{formatCurrency(total * 12)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
