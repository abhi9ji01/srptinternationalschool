"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function StudentFeesPage() {
  const [studentId, setStudentId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (sid) => {
    setLoading(true);
    try {
      const d = await api.get(`/fees/invoices?student_id=${sid}`);
      setInvoices(d || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    api.get("/reports/dashboard/student").then((d) => {
      setStudentId(d.studentId);
      load(d.studentId);
    }).catch(() => setLoading(false));
  }, [load]);

  async function payOnline(inv) {
    const ok = await loadRazorpay();
    if (!ok) return toast.error("Failed to load payment gateway");
    try {
      const order = await api.post("/fees/razorpay/create-order", { invoice_id: inv.id });
      const rzp = new window.Razorpay({
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Delhi Public School",
        description: `Invoice #${inv.id}`,
        order_id: order.orderId,
        handler: async (resp) => {
          try {
            await api.post("/fees/razorpay/verify", {
              invoice_id: inv.id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            toast.success("Payment successful!");
            load(studentId);
          } catch (e) { toast.error(e.message); }
        },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "category_name", header: "Category" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "balance", header: "Balance", render: (r) => formatCurrency(r.balance) },
    { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)} variant="secondary">{r.status}</Badge> },
    { key: "id", header: "Action", render: (r) => (
      r.status !== "paid" ? <Button size="sm" onClick={() => payOnline(r)}>Pay Online</Button> : <span className="text-green-600 text-sm">Paid</span>
    ) },
  ];

  return (
    <AppShell title="My Fees" allow={["super_admin", "admin", "student"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={invoices} loading={loading} emptyTitle="No invoices" />
      </CardContent></Card>
    </AppShell>
  );
}
