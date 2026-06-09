"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Icons from "lucide-react";
import { navForRole } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/constants";
import { useSchool } from "@/contexts/SchoolContext";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/lib/utils";

export default function Sidebar({ role, schoolName }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = navForRole(role);
  const { school } = useSchool();
  const { unreadCount, announcementCount } = useSocket();
  const name = schoolName || school?.name || "School MS";
  const homeHref = items[0]?.href || "/"; // first nav item is always the role Dashboard

  // Live count badge per nav item.
  const countFor = (href) => {
    if (href.includes("announcements")) return announcementCount;
    if (href.includes("/chat")) return unreadCount;
    return 0;
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card h-screen sticky top-0 transition-all",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <Link href={homeHref} title="Go to home" className="flex items-center gap-2 h-16 px-4 border-b shrink-0 hover:bg-accent transition-colors">
        {school?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logo_url} alt="logo" className="h-8 w-8 rounded object-contain shrink-0" />
        ) : (
          <Icons.GraduationCap className="h-7 w-7 text-primary shrink-0" />
        )}
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </Link>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = Icons[item.icon] || Icons.Circle;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          const count = countFor(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {count > 0 && (collapsed ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              ) : (
                <span className="ml-auto shrink-0 h-5 min-w-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              ))}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="h-10 border-t flex items-center justify-center text-muted-foreground hover:bg-accent"
      >
        {collapsed ? <Icons.ChevronRight className="h-4 w-4" /> : <Icons.ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
