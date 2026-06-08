"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ParentAssignmentsPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [assignments, setAssignments] = useState([]);
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
      const stu = await api.get(`/students/${sid}`);
      const sectionId = stu?.section_id;
      if (!sectionId) { setAssignments([]); setLoading(false); return; }
      const d = await api.get(`/assignments?section_id=${sectionId}`);
      setAssignments(Array.isArray(d) ? d : (d?.data || []));
    } catch (e) {
      toast.error(e.message);
      setAssignments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const columns = [
    { key: "title", header: "Title" },
    { key: "subject_name", header: "Subject" },
    { key: "due_date", header: "Due Date", render: (r) => formatDate(r.due_date) },
    { key: "total_marks", header: "Total Marks", render: (r) => r.total_marks ?? "—" },
  ];

  return (
    <AppShell title="Assignments" allow={["super_admin", "admin", "parent"]}>
      {children.length === 0 && !loading ? (
        <EmptyState title="No children linked" description="Contact the school to link your child's account." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <Button key={c.id} variant={c.id === activeId ? "default" : "outline"} size="sm" onClick={() => setActiveId(c.id)}>
                {c.name}
              </Button>
            ))}
          </div>
          <Card><CardContent className="pt-6">
            <DataTable columns={columns} data={assignments} loading={loading} emptyTitle="No assignments" />
          </CardContent></Card>
        </div>
      )}
    </AppShell>
  );
}
