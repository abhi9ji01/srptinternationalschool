"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import StatCard from "@/components/shared/StatCard";
import ChartCard from "@/components/shared/ChartCard";
import { api } from "@/lib/api";

export default function StudentAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get(`/attendance/report?student_id=${d.studentId}`);
          setData(res);
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const summary = data?.summary || {};
  const percent = data?.percent ?? 0;
  const low = percent < 75;

  return (
    <AppShell title="My Attendance" allow={["super_admin", "admin", "student"]}>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="Attendance %" value={loading ? "…" : `${percent}%`} icon="ClipboardCheck"
          color={low ? "text-red-600" : "text-green-600"} />
        <StatCard title="Present" value={loading ? "…" : (summary.present ?? 0)} icon="CheckCircle2" color="text-green-600" />
        <StatCard title="Absent" value={loading ? "…" : (summary.absent ?? 0)} icon="XCircle" color="text-red-600" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <StatCard title="Total Days" value={loading ? "…" : (summary.total ?? 0)} icon="CalendarDays" />
        <StatCard title="Late" value={loading ? "…" : (summary.late ?? 0)} icon="Clock" color="text-yellow-600" />
        <StatCard title="Excused" value={loading ? "…" : (summary.excused ?? 0)} icon="FileText" color="text-blue-600" />
        <StatCard title="Status" value={low ? "Low" : "Good"} icon="Activity" color={low ? "text-red-600" : "text-green-600"} />
      </div>
      <ChartCard title="Monthly Attendance (Days Present)" type="bar" data={data?.monthly || []} xKey="month" dataKey="present" />
    </AppShell>
  );
}
