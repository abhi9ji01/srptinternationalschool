"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Building2 } from "lucide-react";
import { api } from "@/lib/api";

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function StudentHostelPage() {
  const [alloc, setAlloc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get("/hostel/students");
          const arr = Array.isArray(res) ? res : (res.data || []);
          const mine = arr.find((a) => Number(a.student_id) === Number(d.studentId));
          setAlloc(mine || null);
        } catch {
          // endpoint may be 403 for students; treat as no allocation visible
          setAlloc(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell title="My Hostel" allow={["super_admin", "admin", "student"]}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Hostel Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : !alloc ? (
            <EmptyState title="No hostel allocation / not available" description="You do not have a hostel allocation, or it is not available to view." />
          ) : (
            <div>
              <Row label="Hostel" value={alloc.hostel_name} />
              <Row label="Room Number" value={alloc.room_number} />
              <Row label="Status" value={alloc.status} />
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
