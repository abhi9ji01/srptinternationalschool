"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import ReportCardView from "@/components/reportcard/ReportCardView";

export default function AdminStudentReportCardPage() {
  const { id } = useParams();
  return (
    <AppShell title="Student Report Card" allow={["super_admin", "admin"]}>
      <div className="mb-4 no-print">
        <Button asChild variant="outline"><Link href={`/admin/students/${id}`}>← Back to Profile</Link></Button>
      </div>
      <ReportCardView studentId={id} academicYearId={0} admin />
    </AppShell>
  );
}
