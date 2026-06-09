"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const SocketContext = createContext(null);

const CHAT_ROLES = ["super_admin", "admin", "teacher", "hr_manager", "transport_manager",
  "hostel_warden", "canteen_manager", "health_officer", "librarian", "accountant", "security_guard"];

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const canChat = user && CHAT_ROLES.includes(user.role);

  // Connect for EVERY authenticated user (announcements reach all roles).
  // Chat-only handlers stay gated behind canChat.
  useEffect(() => {
    if (!user) return;
    const s = getSocket();
    setSocket(s);

    // New-announcement badge (all roles).
    const onNewAnnouncement = (a) => {
      if (pathRef.current?.includes("announcements")) return; // already viewing the list
      setAnnouncementCount((c) => c + 1);
      toast.message("New announcement", { description: a?.title?.slice(0, 80) });
    };
    s.on("new_announcement", onNewAnnouncement);

    // Chat handlers — only for chat-enabled roles.
    let detachChat = () => {};
    if (canChat) {
      const onOnlineUsers = ({ user_ids }) => setOnlineUsers(new Set(user_ids));
      const onUserOnline = ({ user_id }) => setOnlineUsers((prev) => new Set(prev).add(user_id));
      const onUserOffline = ({ user_id }) => setOnlineUsers((prev) => { const n = new Set(prev); n.delete(user_id); return n; });
      const onReceive = (msg) => {
        // Only count/notify messages addressed to me from someone else.
        if (msg.sender_id === user.id) return;
        if (!pathRef.current?.includes("/chat")) {
          setUnreadCount((c) => c + 1);
          toast.message("New message", { description: msg.message?.slice(0, 80) });
        }
      };
      s.on("online_users", onOnlineUsers);
      s.on("user_online", onUserOnline);
      s.on("user_offline", onUserOffline);
      s.on("receive_message", onReceive);
      api.get("/chat/unread-count").then((d) => setUnreadCount(d.unread || 0)).catch(() => {});
      detachChat = () => {
        s.off("online_users", onOnlineUsers);
        s.off("user_online", onUserOnline);
        s.off("user_offline", onUserOffline);
        s.off("receive_message", onReceive);
      };
    }

    return () => {
      s.off("new_announcement", onNewAnnouncement);
      detachChat();
    };
  }, [canChat, user?.id]);

  // Clear the announcement badge once the user opens any announcements page.
  useEffect(() => {
    if (pathname?.includes("announcements")) setAnnouncementCount(0);
  }, [pathname]);

  // Disconnect when the user logs out.
  useEffect(() => {
    if (!user) { disconnectSocket(); setSocket(null); setOnlineUsers(new Set()); setUnreadCount(0); setAnnouncementCount(0); }
  }, [user]);

  const sendMessage = useCallback((toUserId, message, type = "text") => {
    const s = getSocket();
    s.emit("send_message", { to_user_id: toUserId, message, type });
  }, []);

  const refreshUnread = useCallback(() => {
    if (!canChat) return;
    api.get("/chat/unread-count").then((d) => setUnreadCount(d.unread || 0)).catch(() => {});
  }, [canChat]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, setOnlineUsers, unreadCount, setUnreadCount, announcementCount, setAnnouncementCount, sendMessage, refreshUnread, canChat }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) return { socket: null, onlineUsers: new Set(), setOnlineUsers: () => {}, unreadCount: 0, setUnreadCount: () => {}, announcementCount: 0, setAnnouncementCount: () => {}, sendMessage: () => {}, refreshUnread: () => {}, canChat: false };
  return ctx;
}
