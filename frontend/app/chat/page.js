"use client";
import ChatPage from "@/components/chat/ChatPage";

// Every chat-capable role uses this single page; the backend enforces who
// each user is allowed to message (admins/super_admins ↔ staff).
const CHAT_ROLES = ["super_admin", "admin", "teacher", "hr_manager", "transport_manager",
  "hostel_warden", "canteen_manager", "health_officer", "librarian", "accountant", "security_guard"];

export default function UnifiedChatPage() {
  return <ChatPage title="Chat" allow={CHAT_ROLES} />;
}
