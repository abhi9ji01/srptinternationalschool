"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ invoice_id: "", amount: "", payment_mode: "cash" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/fees/payments");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function record(e) {
    e.preventDefault();
    try {
      const res = await api.post("/fees/payments", {
        invoice_id: form.invoice_id,
        amount: form.amount,
        payment_mode: form.payment_mode,
      });
      toast.success(`Payment recorded: ${res.receipt_number}`);
      setOpen(false);
      setForm({ invoice_id: "", amount: "", payment_mode: "cash" });
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "receipt_number", header: "Receipt #" },
    { key: "student_name", header: "Student" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "payment_mode", header: "Mode" },
    { key: "payment_date", header: "Date", render: (r) => formatDateTime(r.payment_date) },
    {
      key: "is_online", header: "Source", render: (r) => (
        <Badge variant="secondary" className={r.is_online ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
          {r.is_online ? "Online" : "Offline"}
        </Badge>
      ),
    },
  ];

  return (
    <AppShell title="Payments" allow={ALLOW}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No payments yet"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Record Payment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <form onSubmit={record} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Invoice ID</Label>
                    <Input type="number" value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter><Button type="submit">Record</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
