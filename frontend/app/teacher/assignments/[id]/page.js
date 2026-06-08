"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { statusColor } from "@/lib/utils";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api.get(`/assignments/${id}/submissions`);
      setAssignment(d.assignment || null);
      setRows((d.submissions || []).map((s) => ({
        ...s,
        _marks: s.marks_obtained ?? "",
        _feedback: s.feedback ?? "",
      })));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

  function update(sid, patch) {
    setRows((rs) => rs.map((r) => (r.student_id === sid ? { ...r, ...patch } : r)));
  }

  async function grade(row) {
    if (!row.submission_id) return toast.error("No submission to grade");
    setSavingId(row.submission_id);
    try {
      await api.post(`/assignments/${id}/grade`, {
        submission_id: row.submission_id,
        marks_obtained: row._marks === "" ? null : Number(row._marks),
        feedback: row._feedback || null,
      });
      toast.success("Graded");
      load();
    } catch (e) { toast.error(e.message); }
    setSavingId(null);
  }

  return (
    <AppShell title={assignment ? `Submissions: ${assignment.title}` : "Submissions"} allow={["super_admin", "admin", "teacher"]}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {assignment ? `${assignment.title}${assignment.total_marks ? ` (Total: ${assignment.total_marks})` : ""}` : "Submissions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No submissions" description="No students found for this assignment." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="w-28">Marks</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.student_id}>
                    <TableCell>{r.roll_number}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(r.status)} variant="outline">{r.status || "pending"}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.file_url ? <a href={r.file_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Open</a> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={r._marks} disabled={!r.submission_id}
                        onChange={(e) => update(r.student_id, { _marks: e.target.value })} className="w-24" />
                    </TableCell>
                    <TableCell>
                      <Input value={r._feedback} disabled={!r.submission_id}
                        onChange={(e) => update(r.student_id, { _feedback: e.target.value })} placeholder="Feedback" />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" disabled={!r.submission_id || savingId === r.submission_id} onClick={() => grade(r)}>
                        {savingId === r.submission_id ? "..." : "Grade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
