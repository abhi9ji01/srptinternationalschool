"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function VisitorPassPage() {
  const { id } = useParams();
  const [v, setV] = useState(null);
  useEffect(() => { api.get(`/visitors/${id}/pass`).then(setV).catch(() => {}); }, [id]);

  return (
    <AppShell title="Visitor Pass" allow={["super_admin", "admin", "security_guard"]}>
      <div className="no-print mb-4">
        <Button onClick={() => window.print()}>Print Pass</Button>
      </div>
      <div className="print-area max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold">{v?.school_name || "School"}</h2>
            <p className="text-sm text-muted-foreground mb-4">Visitor Pass</p>
            <div className="border-2 border-dashed rounded-lg p-4 space-y-2 text-left">
              <Row label="Pass No." value={v?.pass_number} />
              <Row label="Name" value={v?.name} />
              <Row label="Phone" value={v?.phone} />
              <Row label="Purpose" value={v?.purpose} />
              <Row label="To Meet" value={v?.whom_to_meet} />
              <Row label="Vehicle" value={v?.vehicle_number} />
              <Row label="In Time" value={formatDateTime(v?.in_time)} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Please return this pass at the gate on exit.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
