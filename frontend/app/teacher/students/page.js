"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const COLUMNS = [
  { key: "roll_number", header: "Roll No." },
  { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "admission_number", header: "Admission No." },
  { key: "guardian_phone", header: "Guardian Phone" },
];

export default function TeacherStudentsPage() {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/sections-detailed").then((d) => setSections(Array.isArray(d) ? d : d.data || [])).catch(() => {}); }, []);

  async function load(secId) {
    setSectionId(secId);
    if (!secId) { setRows([]); return; }
    setLoading(true);
    try {
      const d = await api.get(`/students?section_id=${secId}`);
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  return (
    <AppShell title="My Students" allow={["super_admin", "admin", "teacher"]}>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={load}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="pt-6">
        <DataTable columns={COLUMNS} data={rows} loading={loading} emptyTitle="No students" />
      </CardContent></Card>
    </AppShell>
  );
}
