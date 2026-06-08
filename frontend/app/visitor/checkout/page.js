"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function VisitorCheckoutPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/visitors?today=1");
      const arr = Array.isArray(d) ? d : d.data || [];
      setRows(arr.filter((v) => !v.out_time));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function checkout(id) {
    try {
      await api.post(`/visitors/${id}/checkout`);
      toast.success("Checked out");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "whom_to_meet", header: "Whom to Meet" },
    { key: "in_time", header: "In Time", render: (r) => formatDateTime(r.in_time) },
    { key: "pass_number", header: "Pass" },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => checkout(r.id)}>Check Out</Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Visitor Check-out" allow={["super_admin", "admin", "security_guard"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No visitors inside" />
      </CardContent></Card>
    </AppShell>
  );
}
