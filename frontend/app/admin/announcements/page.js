"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const ROLES = ["all", "student", "parent", "teacher", "accountant"];

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ target_role: "all" });
  const [delId, setDelId] = useState(null);

  async function load() {
    setLoading(true);
    try { setItems(await api.get("/announcements")); } catch (e) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try { await api.post("/announcements", form); toast.success("Posted"); setOpen(false); setForm({ target_role: "all" }); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function remove() { await api.del(`/announcements/${delId}`); toast.success("Deleted"); load(); }

  const columns = [
    { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "target_role", header: "Audience" },
    { key: "posted_by_name", header: "By" },
    { key: "publish_date", header: "Date", render: (r) => formatDate(r.publish_date) },
    { key: "id", header: "", render: (r) => <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelId(r.id)}>Delete</Button> },
  ];

  return (
    <AppShell title="Announcements" allow={["super_admin", "admin"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={items} loading={loading} emptyTitle="No announcements"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-3">
                  <div className="space-y-2"><Label>Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select value={form.target_role} onValueChange={(v) => setForm({ ...form, target_role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <DialogFooter><Button type="submit">Post</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
      <ConfirmDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)} onConfirm={remove} title="Delete announcement?" />
    </AppShell>
  );
}
