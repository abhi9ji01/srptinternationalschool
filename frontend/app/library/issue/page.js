"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDate, statusColor } from "@/lib/utils";

export default function LibraryIssuePage() {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ book_id: "", issued_to_type: "student", issued_to_id: "" });

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/library/issues");
      const arr = Array.isArray(d) ? d : d.data || [];
      setIssues(arr.filter((i) => i.status === "issued"));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    api.get("/library/books").then((d) => setBooks(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    loadIssues();
  }, [loadIssues]);

  async function submit(e) {
    e.preventDefault();
    if (!form.book_id || !form.issued_to_id) return toast.error("Book and Member ID are required");
    setSubmitting(true);
    try {
      const res = await api.post("/library/issue", {
        book_id: form.book_id,
        issued_to_id: form.issued_to_id,
        issued_to_type: form.issued_to_type,
      });
      toast.success(`Issued, due ${res.due_date}`);
      setForm({ book_id: "", issued_to_type: "student", issued_to_id: "" });
      loadIssues();
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  const columns = [
    { key: "book_title", header: "Book" },
    { key: "member_name", header: "Member" },
    { key: "issue_date", header: "Issued", render: (r) => formatDate(r.issue_date) },
    { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
  ];

  return (
    <AppShell title="Issue Book" allow={["super_admin", "admin", "librarian"]}>
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Issue a Book</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={form.book_id ? String(form.book_id) : ""} onValueChange={(v) => setForm({ ...form, book_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{`${b.title} (avail: ${b.available_copies})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue To</Label>
              <Select value={form.issued_to_type} onValueChange={(v) => setForm({ ...form, issued_to_type: v })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member ID</Label>
              <Input type="number" placeholder="student.id or teacher.id" value={form.issued_to_id}
                onChange={(e) => setForm({ ...form, issued_to_id: e.target.value })} />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? "Issuing..." : "Issue"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Currently Issued</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={issues} loading={loading} emptyTitle="No issued books" />
        </CardContent>
      </Card>
    </AppShell>
  );
}
