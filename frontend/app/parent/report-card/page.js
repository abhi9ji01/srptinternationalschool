"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import { api } from "@/lib/api";

export default function ParentReportCardPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get("/reports/dashboard/parent");
        const kids = d.children || [];
        setChildren(kids);
        if (kids.length) setActiveId(kids[0].id);
        else setLoading(false);
      } catch (e) {
        toast.error(e.message);
        setLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async (sid) => {
    setLoading(true);
    try {
      const d = await api.get(`/students/${sid}/report-card`);
      setCard(d || null);
    } catch (e) {
      toast.error(e.message);
      setCard(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const student = card?.student || {};
  const marks = card?.marks || [];

  return (
    <AppShell title="Report Card" allow={["super_admin", "admin", "parent"]}>
      {children.length === 0 && !loading ? (
        <EmptyState title="No children linked" description="Contact the school to link your child's account." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {children.map((c) => (
              <Button key={c.id} variant={c.id === activeId ? "default" : "outline"} size="sm" onClick={() => setActiveId(c.id)}>
                {c.name}
              </Button>
            ))}
            <Button className="ml-auto" size="sm" onClick={() => window.print()} disabled={loading || !card}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : !card ? (
            <EmptyState title="No report card available" />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="print-area space-y-6">
                  <div className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">Delhi Public School</h1>
                    <p className="text-sm text-muted-foreground">Academic Report Card</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{student.name || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Admission No.</span><span className="font-medium">{student.admission_number || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Class</span><span className="font-medium">{student.class_name || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Section</span><span className="font-medium">{student.section_name || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Roll No.</span><span className="font-medium">{student.roll_number || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Attendance</span><span className="font-medium">{card.attendancePercent ?? 0}%</span></div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Exam</TableHead>
                          <TableHead className="text-right">Marks</TableHead>
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
                            <TableCell>{m.grade || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col items-end gap-1 text-sm">
                    <div className="flex justify-between w-64"><span className="text-muted-foreground">Total Marks</span><span className="font-medium">{card.obtained ?? 0} / {card.totalMarks ?? 0}</span></div>
                    <div className="flex justify-between w-64"><span className="text-muted-foreground">Percentage</span><span className="font-bold">{card.percentage ?? 0}%</span></div>
                    <div className="flex justify-between w-64"><span className="text-muted-foreground">Attendance</span><span className="font-medium">{card.attendancePercent ?? 0}%</span></div>
                  </div>

                  <div className="flex justify-between pt-12 text-sm text-muted-foreground">
                    <span>Class Teacher</span>
                    <span>Principal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
