"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate, statusColor } from "@/lib/utils";

export default function TeacherLeavePage() {
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ total_days: 1 });

  async function load() {
    setLoading(true);
    try {
      const d = await api.get("/hr/leaves");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) {
      // teacher may have no staff record / 403 — show empty gracefully
      setRows([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    (async () => {
      try {
        const d = await api.get("/hr/leave-types");
        setTypes(Array.isArray(d) ? d : d.data || []);
      } catch (e) { setTypes([]); }
    })();
  }, []);

  async function apply(e) {
    e.preventDefault();
    try {
      await api.post("/hr/leaves", form);
      toast.success("Leave applied");
      setOpen(false);
      setForm({ total_days: 1 });
      load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Leave" allow={["super_admin", "admin", "teacher"]}>
      <Card><CardContent className="pt-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Apply Leave</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
              <form onSubmit={apply} className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Leave Type</Label>
                  <Select value={form.leave_type_id ? String(form.leave_type_id) : ""} onValueChange={(v) => setForm({ ...form, leave_type_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{types.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input type="date" value={form.from_date || ""} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input type="date" value={form.to_date || ""} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Total Days</Label>
                  <Input type="number" value={form.total_days ?? ""} onChange={(e) => setForm({ ...form, total_days: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Reason</Label>
                  <Textarea value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
                <DialogFooter className="col-span-2"><Button type="submit">Submit</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No leave records" description="You have not applied for any leave yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.leave_type || "—"}</TableCell>
                  <TableCell>{formatDate(r.from_date)}</TableCell>
                  <TableCell>{formatDate(r.to_date)}</TableCell>
                  <TableCell>{r.total_days}</TableCell>
                  <TableCell><Badge className={statusColor(r.status)} variant="outline">{r.status || "pending"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AppShell>
  );
}
