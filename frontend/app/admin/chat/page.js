"use client";
import ChatPage from "@/components/chat/ChatPage";

export default function AdminChatPage() {
  return <ChatPage title="Chat" allow={["super_admin", "admin"]} />;
}
