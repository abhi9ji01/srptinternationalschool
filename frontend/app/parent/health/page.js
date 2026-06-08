"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ParentHealthPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [record, setRecord] = useState(null);
  const [visits, setVisits] = useState([]);
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
      const d = await api.get(`/health/records/${sid}`);
      setRecord(d?.record || null);
      setVisits(d?.visits || []);
    } catch (e) {
      toast.error(e.message);
      setRecord(null);
      setVisits([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeId) load(activeId);
  }, [activeId, load]);

  const fields = record ? [
    ["Blood Group", record.blood_group],
    ["Height", record.height ? `${record.height} cm` : null],
    ["Weight", record.weight ? `${record.weight} kg` : null],
    ["Allergies", record.allergies],
    ["Medical Conditions", record.medical_conditions],
    ["Doctor", record.doctor_name],
    ["Doctor Phone", record.doctor_phone],
    ["Emergency Contact", record.emergency_contact],
    ["Last Checkup", record.last_checkup_date ? formatDate(record.last_checkup_date) : null],
    ["Notes", record.notes],
  ] : [];

  const visitColumns = [
    { key: "visit_date", header: "Date", render: (r) => formatDate(r.visit_date) },
    { key: "symptoms", header: "Symptoms" },
    { key: "diagnosis", header: "Diagnosis" },
    { key: "treatment", header: "Treatment" },
    { key: "doctor", header: "Doctor" },
    { key: "follow_up_date", header: "Follow Up", render: (r) => r.follow_up_date ? formatDate(r.follow_up_date) : "—" },
  ];

  return (
    <AppShell title="Health" allow={["super_admin", "admin", "parent"]}>
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

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : !record ? (
            <EmptyState title="No health record" description="No health record has been created for this child yet." />
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Health Record</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {fields.map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm border-b pb-2">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium text-right">{value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Medical Visits</CardTitle></CardHeader>
                <CardContent>
                  <DataTable columns={visitColumns} data={visits} emptyTitle="No medical visits" searchable={false} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
