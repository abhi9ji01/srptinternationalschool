"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/announcements").then(setItems).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <AppShell title="Announcements">
      {!loading && items.length === 0 ? <EmptyState title="No announcements" /> : (
        <div className="space-y-3 max-w-3xl">
          {items.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{a.title}</span>
                  <Badge variant="outline">{formatDate(a.publish_date)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">— {a.posted_by_name || "School"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
