"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PAY_LABEL = { cash: "Cash", bank_transfer: "Bank Transfer", upi: "UPI", cheque: "Cheque", bank: "Bank Transfer" };

export default function PayrollSlipPage() {
  const { id } = useParams();
  const [d, setD] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/hr/payroll/${id}/slip`).then(setD).catch((e) => toast.error(e.message));
  }, [id]);

  const earnings = [
    ["Basic Salary", d?.basic_salary],
    ["HRA", d?.hra],
    ["DA", d?.da],
  ];
  const deductions = [
    ["TDS", d?.tds],
    ["PF", d?.pf],
    ["ESI", d?.esi],
    ["LOP Deduction", d?.lop_deduction],
  ];
  const totalEarnings = earnings.reduce((s, [, v]) => s + Number(v || 0), 0);
  const totalDeductions = deductions.reduce((s, [, v]) => s + Number(v || 0), 0);

  return (
    <AppShell title="Salary Slip" allow={["super_admin", "admin", "hr_manager"]}>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mb-4 no-print">
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
      </div>

      <Card className="max-w-3xl mx-auto print-area">
        <CardContent className="p-8">
          {!d ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="text-center border-b pb-4 mb-6">
                <h1 className="text-xl font-bold">{d.school_name || "School"}</h1>
                <p className="text-sm text-muted-foreground">Salary Slip — {MONTHS[Number(d.month)] || d.month} {d.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{d.staff_name}</span></div>
                <div><span className="text-muted-foreground">Employee ID: </span><span className="font-medium">{d.employee_id || "—"}</span></div>
                <div><span className="text-muted-foreground">Designation: </span><span className="font-medium">{d.designation || "—"}</span></div>
                <div><span className="text-muted-foreground">Department: </span><span className="font-medium">{d.department || "—"}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h2 className="font-semibold border-b pb-1 mb-2">Earnings</h2>
                  {earnings.map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 text-sm">
                      <span>{k}</span><span>{formatCurrency(v)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-sm font-semibold border-t mt-1">
                    <span>Total Earnings</span><span>{formatCurrency(totalEarnings)}</span>
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold border-b pb-1 mb-2">Deductions</h2>
                  {deductions.map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 text-sm">
                      <span>{k}</span><span>{formatCurrency(v)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-sm font-semibold border-t mt-1">
                    <span>Total Deductions</span><span>{formatCurrency(totalDeductions)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-4 text-lg font-bold">
                <span>Net Salary</span><span>{formatCurrency(d.net_salary)}</span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>
                  Status:{" "}
                  <span className={d.status === "paid" ? "font-semibold text-green-600" : "font-semibold text-amber-600"}>
                    {d.status || "pending"}
                  </span>
                </span>
                {d.status === "paid" && (
                  <span>Paid via {PAY_LABEL[d.payment_mode] || d.payment_mode || "—"}{d.payment_date ? ` on ${d.payment_date}` : ""}</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
