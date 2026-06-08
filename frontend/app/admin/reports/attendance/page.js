"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AttendanceReportPage() {
  const [bySection, setBySection] = useState([]);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get("/reports/attendance");
        setBySection(d.bySection || []);
        setLowAttendance(d.lowAttendance || []);
      } catch (e) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, []);

  const sectionCols = [
    { key: "class_name", header: "Class" },
    { key: "section_name", header: "Section" },
    { key: "percent", header: "Attendance %", render: (r) => `${r.percent ?? 0}%` },
    { key: "students", header: "Students" },
  ];

  const lowCols = [
    { key: "name", header: "Student" },
    { key: "class_name", header: "Class" },
    { key: "section_name", header: "Section" },
    { key: "percent", header: "Attendance %", render: (r) => `${r.percent ?? 0}%` },
  ];

  return (
    <AppShell title="Attendance Report" allow={["super_admin", "admin"]}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Sections" value={bySection.length} icon="LayoutGrid" />
          <StatCard title="Low Attendance (<75%)" value={lowAttendance.length} icon="AlertTriangle" color="text-red-600" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Attendance by Section</h2>
            <DataTable columns={sectionCols} data={bySection} loading={loading} searchable={false} emptyTitle="No data" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Low Attendance Students</h2>
            <DataTable columns={lowCols} data={lowAttendance} loading={loading} searchable={false} emptyTitle="No low-attendance students" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
