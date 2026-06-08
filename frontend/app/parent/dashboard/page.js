"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  useEffect(() => { api.get("/reports/dashboard/parent").then((d) => setChildren(d.children || [])).catch(() => {}); }, []);
  return (
    <AppShell title="Parent Dashboard" allow={["super_admin", "admin", "parent"]}>
      {children.length === 0 ? <EmptyState title="No children linked" description="Contact the school to link your child's account." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{c.name}</span>
                  <Badge variant="outline">{c.class_name} {c.section_name}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Attendance</span><span>{c.attendance_pct ?? 0}%</span></div>
                  <Progress value={c.attendance_pct || 0} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fee Due</span>
                  <span className={`font-semibold ${Number(c.fee_due) > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(c.fee_due)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
