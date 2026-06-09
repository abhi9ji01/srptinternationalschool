"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate, statusColor } from "@/lib/utils";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function AdminComplaintsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState(null);
  const [edit, setEdit] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get(`/complaints${filter ? `?status=${filter}` : ""}`);
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  function openManage(r) {
    setActive(r);
    setEdit({ status: r.status, resolution: r.resolution || "" });
  }

  async function save() {
    try {
      await api.post(`/complaints/${active.id}/status`, edit);
      toast.success("Complaint updated");
      setActive(null); load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Complaint Management" allow={["super_admin", "admin", "hr_manager"]}>
      <Card><CardContent className="space-y-4 pt-6">
        <div className="flex items-end gap-3">
          <div className="space-y-2">
            <Label>Filter status</Label>
            <Select value={filter || "all"} onValueChange={(v) => setFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No complaints" description="No complaints match this filter." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.subject}</TableCell>
                  <TableCell>{r.raised_by_name}</TableCell>
                  <TableCell>{r.category || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.priority}</Badge></TableCell>
                  <TableCell><Badge className={statusColor(r.status)} variant="outline">{r.status}</Badge></TableCell>
                  <TableCell>{formatDate(r.created_at)}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openManage(r)}>Manage</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{active?.subject}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{active?.description || "No description."}</p>
            <p className="text-xs text-muted-foreground">Raised by {active?.raised_by_name} · {formatDate(active?.created_at)}</p>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution / Notes</Label>
              <Textarea value={edit.resolution} onChange={(e) => setEdit({ ...edit, resolution: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
