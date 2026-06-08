"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { HeartPulse } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function StudentHealthPage() {
  const [record, setRecord] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get(`/health/records/${d.studentId}`);
          setRecord(res?.record || null);
          setVisits(res?.visits || []);
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  const columns = [
    { key: "visit_date", header: "Date", render: (r) => formatDate(r.visit_date) },
    { key: "symptoms", header: "Symptoms" },
    { key: "diagnosis", header: "Diagnosis" },
    { key: "treatment", header: "Treatment" },
  ];

  return (
    <AppShell title="My Health" allow={["super_admin", "admin", "student"]}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /> Health Record</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : !record ? (
              <EmptyState title="No health record" description="No health record has been created for you yet." />
            ) : (
              <div>
                <Row label="Blood Group" value={record.blood_group} />
                <Row label="Height" value={record.height} />
                <Row label="Weight" value={record.weight} />
                <Row label="Allergies" value={record.allergies} />
                <Row label="Medical Conditions" value={record.medical_conditions} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Medical Visits</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={columns} data={visits} loading={loading} searchable={false} emptyTitle="No medical visits" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
