"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const STATUSES = ["promoted", "failed", "detained"];

export default function PromoteStudentsPage() {
  const [sections, setSections] = useState([]);
  const [fromSection, setFromSection] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/sections-detailed")
      .then((d) => setSections(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, []);

  async function loadStudents() {
    if (!fromSection) {
      toast.error("Select a section first");
      return;
    }
    setLoading(true);
    try {
      const d = await api.get(`/students?section_id=${fromSection}`);
      const arr = Array.isArray(d) ? d : d.data || [];
      setRows(arr.map((s) => ({
        student_id: s.id,
        name: s.name,
        from_section_id: fromSection,
        to_section_id: "",
        status: "promoted",
      })));
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  }

  function update(id, key, value) {
    setRows((prev) => prev.map((r) => (r.student_id === id ? { ...r, [key]: value } : r)));
  }

  async function promote() {
    if (rows.length === 0) {
      toast.error("No students to promote");
      return;
    }
    setSaving(true);
    try {
      await api.post("/students/promote/bulk", {
        academic_year_id: null,
        promotions: rows.map((r) => ({
          student_id: r.student_id,
          from_section_id: r.from_section_id || null,
          to_section_id: r.to_section_id || null,
          status: r.status,
        })),
      });
      toast.success("Students processed");
      setRows([]);
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  }

  return (
    <AppShell title="Promote Students" allow={["super_admin", "admin"]}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>From Section</Label>
              <Select value={fromSection} onValueChange={setFromSection}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadStudents} disabled={loading}>
              {loading ? "Loading..." : "Load Students"}
            </Button>
          </div>

          {rows.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Target Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.student_id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Select value={r.status} onValueChange={(v) => update(r.student_id, "status", v)}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={r.to_section_id} onValueChange={(v) => update(r.student_id, "to_section_id", v)}>
                            <SelectTrigger className="w-56"><SelectValue placeholder="Select section" /></SelectTrigger>
                            <SelectContent>
                              {sections.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={promote} disabled={saving}>
                {saving ? "Processing..." : "Promote"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
