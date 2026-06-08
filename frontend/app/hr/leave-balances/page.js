"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function HrLeaveBalancesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/hr/leave-balances");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "staff_name", header: "Staff" },
    { key: "leave_type", header: "Leave Type" },
    { key: "total_days", header: "Total" },
    { key: "used_days", header: "Used" },
    { key: "remaining_days", header: "Remaining" },
  ];

  return (
    <AppShell title="Leave Balances" allow={["super_admin", "admin", "hr_manager"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No leave balances" />
      </CardContent></Card>
    </AppShell>
  );
}
