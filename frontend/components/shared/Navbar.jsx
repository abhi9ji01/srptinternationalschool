"use client";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Moon, Sun, User, LogOut, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "@/contexts/SocketContext";
import { ROLE_LABELS } from "@/lib/constants";
import { navForRole } from "@/lib/navigation";
import { initials } from "@/lib/utils";
import * as Icons from "lucide-react";

export default function Navbar({ title }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount, canChat } = useSocket();
  const router = useRouter();
  const items = navForRole(user?.role);
  const chatHref = "/chat";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-16 px-4 border-b flex flex-row items-center">
            <SheetTitle>{ROLE_LABELS[user?.role] || "Menu"}</SheetTitle>
          </SheetHeader>
          <nav className="p-2 space-y-0.5 overflow-y-auto">
            {items.map((item) => {
              const Icon = Icons[item.icon] || Icons.Circle;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent">
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold truncate">{title}</h1>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {canChat && (
          <Button variant="ghost" size="icon" className="relative" onClick={() => router.push(chatHref)} title="Chat">
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        )}
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                {user?.profilePhoto && <AvatarImage src={user.profilePhoto} />}
                <AvatarFallback>{initials(user?.name || "U")}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>{user?.name}</div>
              <div className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[user?.role]}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/notifications")}>
              <Settings className="h-4 w-4" /> Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
