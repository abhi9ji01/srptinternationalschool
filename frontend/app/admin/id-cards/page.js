"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { IdCard as IdCardIcon, Download } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IdCardModal from "@/components/idcards/IdCardModal";
import IdCard from "@/components/idcards/IdCard";
import { nodesToPdf } from "@/components/idcards/pdf";
import { api } from "@/lib/api";

const ALL = "__all__";

export default function IdCardsPage() {
  const [tab, setTab] = useState("student");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState(ALL);
  const [sectionFilter, setSectionFilter] = useState(ALL);
  const [deptFilter, setDeptFilter] = useState(ALL);
  const [selected, setSelected] = useState(new Set());
  const [style, setStyle] = useState("style1");
  const [single, setSingle] = useState(null); // { type, id, name }

  // Hidden render area for bulk PDF export
  const [bulkCards, setBulkCards] = useState(null);
  const bulkRefs = useRef([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([api.get("/students?limit=200"), api.get("/teachers")]);
      setStudents(Array.isArray(s) ? s : s.data || []);
      setTeachers(Array.isArray(t) ? t : t.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { setSelected(new Set()); }, [tab, classFilter, sectionFilter, deptFilter]);

  const classes = useMemo(() => [...new Set(students.map((s) => s.class_name).filter(Boolean))], [students]);
  const sections = useMemo(() => [...new Set(students.map((s) => s.section_name).filter(Boolean))], [students]);
  const depts = useMemo(() => [...new Set(teachers.map((t) => t.department).filter(Boolean))], [teachers]);

  const studentRows = students.filter((s) =>
    (classFilter === ALL || s.class_name === classFilter) &&
    (sectionFilter === ALL || s.section_name === sectionFilter));
  const teacherRows = teachers.filter((t) => deptFilter === ALL || t.department === deptFilter);

  const rows = tab === "student" ? studentRows : teacherRows;

  function toggle(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected((prev) => prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function bulkDownload() {
    if (!selected.size) return toast.error("Select at least one row");
    try {
      const d = await api.post("/id-cards/bulk-download", { type: tab, ids: [...selected] });
      if (!d.data?.length) return toast.error("No card data");
      bulkRefs.current = [];
      setBulkCards(d.data);
    } catch (e) { toast.error(e.message); }
  }

  // Once hidden cards render, export them and clear.
  useEffect(() => {
    if (!bulkCards) return;
    const t = setTimeout(async () => {
      try { await nodesToPdf(bulkRefs.current.filter(Boolean), `${tab}-id-cards.pdf`); toast.success("Downloaded"); }
      catch { toast.error("Export failed"); }
      setBulkCards(null);
    }, 400); // allow images/QR to paint
    return () => clearTimeout(t);
  }, [bulkCards, tab]);

  const columns = [
    {
      key: "_sel", header: <Checkbox checked={rows.length > 0 && selected.size === rows.length} onCheckedChange={toggleAll} />,
      render: (r) => <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />,
    },
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    ...(tab === "student"
      ? [
          { key: "class_name", header: "Class", render: (r) => `${r.class_name || "—"}${r.section_name ? `-${r.section_name}` : ""}` },
          { key: "roll_number", header: "Roll No" },
          { key: "admission_number", header: "Adm No" },
        ]
      : [
          { key: "employee_id", header: "Emp ID" },
          { key: "designation", header: "Designation" },
          { key: "department", header: "Department" },
        ]),
    {
      key: "_act", header: "", className: "text-right",
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => setSingle({ type: tab, id: r.id, name: r.name })}>
          <IdCardIcon className="h-4 w-4" /> Generate
        </Button>
      ),
    },
  ];

  const StyleSelect = (
    <Select value={style} onValueChange={setStyle}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="style1">Style 1 — Vertical</SelectItem>
        <SelectItem value="style2">Style 2 — Horizontal</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <AppShell title="ID Cards" allow={["super_admin", "admin"]}>
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="teacher">Teachers</TabsTrigger>
        </TabsList>

        <Card><CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {tab === "student" ? (
              <>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>All classes</SelectItem>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>All sections</SelectItem>{sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </>
            ) : (
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All departments</SelectItem>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="ml-auto flex items-center gap-2">
              {StyleSelect}
              <Button onClick={bulkDownload} disabled={!selected.size}><Download className="h-4 w-4" /> Bulk Download ({selected.size})</Button>
            </div>
          </div>

          <TabsContent value="student" className="m-0"><DataTable columns={columns} data={studentRows} loading={loading} searchable emptyTitle="No students" /></TabsContent>
          <TabsContent value="teacher" className="m-0"><DataTable columns={columns} data={teacherRows} loading={loading} searchable emptyTitle="No teachers" /></TabsContent>
        </CardContent></Card>
      </Tabs>

      {single && <IdCardModal open={!!single} onOpenChange={(v) => !v && setSingle(null)} type={single.type} id={single.id} name={single.name} />}

      {/* Hidden bulk render area */}
      {bulkCards && (
        <div style={{ position: "fixed", left: -10000, top: 0 }} aria-hidden>
          {bulkCards.map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <IdCard ref={(el) => (bulkRefs.current[i] = el)} card={c} style={style} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
