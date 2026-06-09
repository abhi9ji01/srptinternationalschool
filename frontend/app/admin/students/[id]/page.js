"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import IdCardButton from "@/components/idcards/IdCardButton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function StudentDetail() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  useEffect(() => { api.get(`/students/${id}`).then(setS).catch(() => {}); }, [id]);

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value || "—"}</span></div>
  );

  return (
    <AppShell title="Student Profile" allow={["super_admin", "admin"]}>
      <div className="flex gap-2 mb-4">
        <Button asChild variant="outline"><Link href={`/admin/students`}>← Back</Link></Button>
        {s && <IdCardButton type="student" id={s.id} name={s.name} />}
        {s && <Button asChild variant="outline"><Link href={`/admin/students/${s.id}/report-card`}>Report Card</Link></Button>}
      </div>
      {!s ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between">{s.name}<Badge variant="outline">{s.class_name} {s.section_name}</Badge></CardTitle></CardHeader>
            <CardContent>
              <Row label="Admission No." value={s.admission_number} />
              <Row label="Roll No." value={s.roll_number} />
              <Row label="Email" value={s.email} />
              <Row label="Phone" value={s.phone} />
              <Row label="DOB" value={formatDate(s.dob)} />
              <Row label="Gender" value={s.gender} />
              <Row label="Blood Group" value={s.blood_group} />
              <Row label="Address" value={s.address} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Guardian & Parents</CardTitle></CardHeader>
            <CardContent>
              <Row label="Father" value={s.father_name} />
              <Row label="Mother" value={s.mother_name} />
              <Row label="Guardian Phone" value={s.guardian_phone} />
              {(s.parents || []).map((p) => (
                <Row key={p.id} label={`${p.relation || "Parent"}`} value={`${p.name} · ${p.phone || p.email || ""}`} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
