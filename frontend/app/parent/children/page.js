"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function ParentChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get("/reports/dashboard/parent");
        setChildren(d.children || []);
      } catch (e) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell title="My Children" allow={["super_admin", "admin", "parent"]}>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : children.length === 0 ? (
        <EmptyState title="No children linked" description="Contact the school to link your child's account." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((c) => {
            const due = Number(c.fee_due || 0);
            return (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <Badge variant="outline">{c.class_name} {c.section_name}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Attendance</span>
                      <span>{c.attendance_pct ?? 0}%</span>
                    </div>
                    <Progress value={Number(c.attendance_pct) || 0} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fee Due</span>
                    <span className={`font-semibold ${due > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(due)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
