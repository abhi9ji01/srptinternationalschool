"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate, statusColor } from "@/lib/utils";

export default function LibraryReturnPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [issued, overdue] = await Promise.all([
        api.get("/library/issues?status=issued"),
        api.get("/library/issues?status=overdue"),
      ]);
      const a1 = Array.isArray(issued) ? issued : issued.data || [];
      const a2 = Array.isArray(overdue) ? overdue : overdue.data || [];
      setRows([...a1, ...a2]);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doReturn(row) {
    try {
      const res = await api.post("/library/return", { issue_id: row.id });
      toast.success(`Returned. Fine: ₹${res.fine}`);
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "book_title", header: "Book" },
    { key: "member_name", header: "Member" },
    { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => doReturn(r)}>Return</Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Return Book" allow={["super_admin", "admin", "librarian"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No books to return" />
      </CardContent></Card>
    </AppShell>
  );
}
