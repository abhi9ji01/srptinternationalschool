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
import { api } from "@/lib/api";
import { formatCurrency, formatDate, statusColor } from "@/lib/utils";

const EMPTY = { allocation_id: "", month: "", amount: "", due_date: "" };

export default function HostelFeesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/hostel/fees");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post("/hostel/fees", {
        allocation_id: form.allocation_id,
        month: form.month,
        amount: form.amount,
        due_date: form.due_date || null,
      });
      toast.success("Fee added");
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.message); }
  }

  async function markPaid(id) {
    try {
      await api.post(`/hostel/fees/${id}/pay`);
      toast.success("Marked paid");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "room_number", header: "Room" },
    { key: "month", header: "Month" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex justify-end">
          {r.status !== "paid" && <Button size="sm" onClick={() => markPaid(r.id)}>Mark Paid</Button>}
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Hostel Fees" allow={["super_admin", "admin", "hostel_warden"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No fees yet"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Fee</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Fee</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid gap-3">
                  <div className="space-y-2">
                    <Label>Allocation ID</Label>
                    <Input type="number" value={form.allocation_id} onChange={(e) => setForm({ ...form, allocation_id: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Input placeholder="e.g. 2025-09" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <DialogFooter><Button type="submit">Create</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
