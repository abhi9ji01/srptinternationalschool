"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api";

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const data = await api.get("/notifications");
      setItems(data.notifications || []);
      setUnread((data.notifications || []).filter((n) => !n.is_read).length);
    } catch (_) {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function markAllRead() {
    await api.post("/notifications/mark-read", { all: true });
    load();
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="font-medium text-sm">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>}
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.link || "/notifications"}
              className={`block p-3 border-b text-sm hover:bg-accent ${n.is_read ? "" : "bg-blue-50/50"}`}
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-muted-foreground text-xs line-clamp-2">{n.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.created_at)}</p>
            </Link>
          ))}
        </div>
        <Link href="/notifications" className="block p-2 text-center text-xs text-primary hover:underline border-t">
          View all
        </Link>
      </PopoverContent>
    </Popover>
  );
}
