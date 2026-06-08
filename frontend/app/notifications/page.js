"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  async function load() {
    const d = await api.get("/notifications");
    setItems(d.notifications || []);
  }
  useEffect(() => { load(); }, []);
  async function markAll() { await api.post("/notifications/mark-read", { all: true }); load(); }

  return (
    <AppShell title="Notifications">
      <div className="flex justify-end mb-3"><Button variant="outline" onClick={markAll}>Mark all read</Button></div>
      <Card><CardContent className="p-0">
        {items.length === 0 ? <EmptyState title="No notifications" /> :
          items.map((n) => (
            <div key={n.id} className={`p-4 border-b ${n.is_read ? "" : "bg-blue-50/50"}`}>
              <div className="flex justify-between"><p className="font-medium">{n.title}</p><span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span></div>
              <p className="text-sm text-muted-foreground">{n.message}</p>
            </div>
          ))}
      </CardContent></Card>
    </AppShell>
  );
}
