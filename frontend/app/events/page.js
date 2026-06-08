"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const TYPE_COLOR = { sports: "bg-green-100 text-green-800", academic: "bg-blue-100 text-blue-800", cultural: "bg-purple-100 text-purple-800", exam: "bg-red-100 text-red-800", holiday: "bg-amber-100 text-amber-800" };

export default function EventsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/events").then((d) => setItems(d.data || d)).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <AppShell title="Events Calendar">
      {!loading && items.length === 0 ? <EmptyState title="No events scheduled" /> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={TYPE_COLOR[e.type] || ""} variant="secondary">{e.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(e.event_date)}</span>
                </div>
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.description}</p>
                {e.venue && <p className="text-xs mt-2">📍 {e.venue}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
