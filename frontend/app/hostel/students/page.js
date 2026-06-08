"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HostelStudentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/hostel/students");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function vacate(id) {
    try {
      await api.post(`/hostel/allocations/${id}/vacate`);
      toast.success("Vacated");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "student_name", header: "Student" },
    { key: "room_number", header: "Room" },
    { key: "hostel_name", header: "Hostel" },
    { key: "check_in_date", header: "Check-in", render: (r) => formatDate(r.check_in_date) },
    { key: "monthly_fee", header: "Monthly Fee", render: (r) => formatCurrency(r.monthly_fee) },
    {
      key: "_actions", header: "", render: (r) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => vacate(r.id)}>Vacate</Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Hostel Students" allow={["super_admin", "admin", "hostel_warden"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No students allocated" />
      </CardContent></Card>
    </AppShell>
  );
}
