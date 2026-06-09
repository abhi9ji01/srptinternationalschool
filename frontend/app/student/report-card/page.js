"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import ReportCardView from "@/components/reportcard/ReportCardView";
import { api } from "@/lib/api";

export default function StudentReportCardPage() {
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then((d) => setStudentId(d.studentId))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Report Card" allow={["super_admin", "admin", "student"]}>
      {loading ? <Skeleton className="h-64 w-full" /> :
        !studentId ? <EmptyState title="No report card" description="Your report card is not available yet." /> :
        <ReportCardView studentId={studentId} academicYearId={0} />}
    </AppShell>
  );
}
