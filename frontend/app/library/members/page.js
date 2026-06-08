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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function LibraryMembersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: "", member_type: "student", max_books_allowed: "3" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/library/members");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post("/library/members", {
        user_id: form.user_id,
        member_type: form.member_type,
        max_books_allowed: form.max_books_allowed,
      });
      toast.success("Member added");
      setOpen(false);
      setForm({ user_id: "", member_type: "student", max_books_allowed: "3" });
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "member_type", header: "Member Type" },
    { key: "max_books_allowed", header: "Max Books" },
    { key: "membership_date", header: "Member Since", render: (r) => formatDate(r.membership_date) },
  ];

  return (
    <AppShell title="Library Members" allow={["super_admin", "admin", "librarian"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No members yet"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Member</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid gap-3">
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input type="number" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Member Type</Label>
                    <Select value={form.member_type} onValueChange={(v) => setForm({ ...form, member_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Books Allowed</Label>
                    <Input type="number" value={form.max_books_allowed} onChange={(e) => setForm({ ...form, max_books_allowed: e.target.value })} />
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
