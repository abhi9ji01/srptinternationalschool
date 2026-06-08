"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ParentDisciplinePage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [records, setRecords] = useState([]);
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
      const d = await api.get(`/discipline?student_id=${sid}`);
      setRecords(Array.isArray(d) ? d : (d?.data || []));
    } catch (e) {
      toast.error(e.message);
      setRecords([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const columns = [
    { key: "incident_date", header: "Date", render: (r) => formatDate(r.incident_date) },
    { key: "type", header: "Type", render: (r) => (
      <Badge className={r.type === "positive" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} variant="secondary">
        {r.type}
      </Badge>
    ) },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
    { key: "action_taken", header: "Action Taken" },
  ];

  return (
    <AppShell title="Discipline" allow={["super_admin", "admin", "parent"]}>
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
            <DataTable columns={columns} data={records} loading={loading} emptyTitle="No discipline records" />
          </CardContent></Card>
        </div>
      )}
    </AppShell>
  );
}
