"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import ChangePasswordCard from "@/components/shared/ChangePasswordCard";
import IdCardButton from "@/components/idcards/IdCardButton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function TeacherDetail() {
  const { id } = useParams();
  const [t, setT] = useState(null);
  useEffect(() => { api.get(`/teachers/${id}`).then(setT).catch(() => {}); }, [id]);

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value || "—"}</span></div>
  );

  return (
    <AppShell title="Teacher Profile" allow={["super_admin", "admin"]}>
      <div className="flex gap-2 mb-4">
        <Button asChild variant="outline"><Link href="/admin/teachers">← Back</Link></Button>
        {t && <IdCardButton type="teacher" id={t.id} name={t.name} />}
      </div>
      {!t ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t.name}</CardTitle></CardHeader>
            <CardContent>
              <Row label="Employee ID" value={t.employee_id} />
              <Row label="Email" value={t.email} />
              <Row label="Phone" value={t.phone} />
              <Row label="Qualification" value={t.qualification} />
              <Row label="Department" value={t.department} />
              <Row label="Designation" value={t.designation} />
              <Row label="Joining Date" value={formatDate(t.joining_date)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(t.assignments || []).length === 0 ? <EmptyState title="No assignments" /> :
                t.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <span>{a.class_name} {a.section_name} {a.subject_name ? `· ${a.subject_name}` : ""}</span>
                    <Badge variant="outline">{a.role === "class_teacher" ? "Class Teacher" : "Subject"}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <ChangePasswordCard userId={t.user_id} userName={t.name} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
