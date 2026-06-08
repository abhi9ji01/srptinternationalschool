"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function TransportStudentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/transport/students");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    try {
      await api.del(`/transport/students/${id}`);
      toast.success("Removed");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "route_name", header: "Route" },
    { key: "vehicle_number", header: "Vehicle" },
    { key: "pickup_stop", header: "Pickup" },
    { key: "drop_stop", header: "Drop" },
    { key: "monthly_fee", header: "Monthly Fee", render: (r) => formatCurrency(r.monthly_fee) },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>Remove</Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Transport Students" allow={["super_admin", "admin", "transport_manager"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No students assigned" />
      </CardContent></Card>
    </AppShell>
  );
}
