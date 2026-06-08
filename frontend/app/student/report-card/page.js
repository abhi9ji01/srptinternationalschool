"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";

export default function StudentReportCardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get(`/students/${d.studentId}/report-card`);
          setData(res);
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const student = data?.student || {};
  const marks = data?.marks || [];

  return (
    <AppShell title="Report Card" allow={["super_admin", "admin", "student"]}>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mb-4 flex justify-end no-print">
        <Button onClick={() => window.print()} disabled={loading || !data}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !data ? (
            <EmptyState title="No report card" description="Your report card is not available yet." />
          ) : (
            <div className="print-area">
              <div className="text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">Delhi Public School</h1>
                <p className="text-sm text-muted-foreground">Academic Report Card</p>
              </div>

              {!data.published && (
                <p className="mb-4 text-sm rounded-md bg-yellow-100 text-yellow-800 px-3 py-2 no-print">
                  Note: This report card has not been officially published yet. Marks shown are provisional.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{student.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Admission No: </span><span className="font-medium">{student.admission_number || "—"}</span></div>
                <div><span className="text-muted-foreground">Class: </span><span className="font-medium">{student.class_name || "—"}</span></div>
                <div><span className="text-muted-foreground">Section: </span><span className="font-medium">{student.section_name || "—"}</span></div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead className="text-right">Obtained</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marks.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No marks recorded</TableCell></TableRow>
                  ) : marks.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{m.subject_name || "—"}</TableCell>
                      <TableCell>{m.exam_name || "—"}</TableCell>
                      <TableCell className="text-right">{m.is_absent ? "AB" : (m.marks_obtained ?? "—")}</TableCell>
                      <TableCell className="text-right">{m.total_marks ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{m.grade || "—"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold border-t-2">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{data.obtained ?? 0}</TableCell>
                    <TableCell className="text-right">{data.totalMarks ?? 0}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Overall Percentage</p>
                  <p className="text-xl font-bold">{data.percentage ?? 0}%</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Attendance</p>
                  <p className="text-xl font-bold">{data.attendancePercent ?? 0}%</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
