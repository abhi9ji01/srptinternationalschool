"use client";
import ChatPage from "@/components/chat/ChatPage";

export default function TeacherChatPage() {
  return <ChatPage title="Chat" allow={["teacher"]} />;
}
