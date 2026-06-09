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

const CATEGORIES = ["Academics", "Facilities", "Transport", "Hostel", "Staff Behaviour", "Fees", "Other"];

export default function ComplaintsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ priority: "medium" });

  async function load() {
    setLoading(true);
    try { const d = await api.get("/complaints"); setRows(Array.isArray(d) ? d : d.data || []); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.subject) return toast.error("Subject required");
    try {
      await api.post("/complaints", form);
      toast.success("Complaint submitted");
      setOpen(false); setForm({ priority: "medium" }); load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Complaints">
      <Card><CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Raise Complaint</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Raise a Complaint</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={form.subject || ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                </div>
                <DialogFooter><Button type="submit">Submit</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No complaints" description="Complaints you raise will appear here with their status." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Raised</TableHead>
                <TableHead>Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.subject}</TableCell>
                  <TableCell>{r.category || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.priority}</Badge></TableCell>
                  <TableCell><Badge className={statusColor(r.status)} variant="outline">{r.status}</Badge></TableCell>
                  <TableCell>{formatDate(r.created_at)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{r.resolution || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AppShell>
  );
}
