"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Search, Send, Check, CheckCheck, Circle } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

const dayKey = (d) => new Date(d).toDateString();
const timeStr = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatPage({ title = "Messages", allow }) {
  const { user } = useAuth();
  const { onlineUsers, setOnlineUsers, sendMessage, setUnreadCount, refreshUnread } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [typingFrom, setTypingFrom] = useState(null);
  const scrollRef = useRef(null);
  const activeRef = useRef(null);
  activeRef.current = active;
  const typingTimer = useRef(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const loadContacts = useCallback(async () => {
    try {
      const d = await api.get("/chat/contacts");
      const data = d.data || [];
      setContacts(data);
      // Seed presence from REST (server computes is_online) so the dots are correct
      // even if the one-time socket "online_users" event was missed (reconnect/timing).
      const onlineIds = data.filter((c) => c.is_online).map((c) => c.id);
      setOnlineUsers((prev) => new Set([...prev, ...onlineIds]));
    } catch (e) { toast.error(e.message); }
  }, [setOnlineUsers]);
  useEffect(() => { loadContacts(); }, [loadContacts]);

  const openConversation = useCallback(async (contact) => {
    setActive(contact);
    setTypingFrom(null);
    try {
      const d = await api.get(`/chat/messages/${contact.id}`);
      setMessages(d.data || []);
      // unread for this contact is now cleared server-side
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, unread_count: 0 } : c)));
      refreshUnread();
      // tell sender we've read their messages
      const unreadIds = (d.data || []).filter((m) => m.receiver_id === user.id && !m.is_read).map((m) => m.id);
      if (unreadIds.length) getSocket().emit("mark_read", { message_ids: unreadIds });
    } catch (e) { toast.error(e.message); }
  }, [user?.id, refreshUnread]);

  // Socket listeners for the live conversation.
  useEffect(() => {
    const s = getSocket();
    const onReceive = (msg) => {
      const a = activeRef.current;
      const inThisConvo = a && (msg.sender_id === a.id || msg.receiver_id === a.id);
      if (inThisConvo) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.sender_id === a.id) {
          s.emit("mark_read", { message_ids: [msg.id] });
          setContacts((prev) => prev.map((c) => (c.id === a.id ? { ...c, unread_count: 0, last_message: msg.message } : c)));
          refreshUnread();
        }
      } else if (msg.sender_id !== user.id) {
        setContacts((prev) => prev.map((c) => (c.id === msg.sender_id ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: msg.message } : c)));
      }
    };
    const onTyping = ({ from_user_id, is_typing }) => {
      const a = activeRef.current;
      if (a && from_user_id === a.id) setTypingFrom(is_typing ? a.id : null);
    };
    const onRead = ({ message_ids }) => {
      setMessages((prev) => prev.map((m) => (message_ids.includes(m.id) ? { ...m, is_read: true } : m)));
    };
    // On (re)connect, the server re-emits presence; refresh contacts so is_online re-seeds.
    const onConnect = () => loadContacts();
    s.on("receive_message", onReceive);
    s.on("typing_indicator", onTyping);
    s.on("read_receipt", onRead);
    s.on("connect", onConnect);
    return () => { s.off("receive_message", onReceive); s.off("typing_indicator", onTyping); s.off("read_receipt", onRead); s.off("connect", onConnect); };
  }, [user?.id, refreshUnread, loadContacts]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, typingFrom]);

  function send() {
    const body = text.trim();
    if (!body || !active) return;
    sendMessage(active.id, body);
    getSocket().emit("stop_typing", { to_user_id: active.id });
    setText("");
  }
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function onType(e) {
    setText(e.target.value);
    if (!active) return;
    getSocket().emit("typing", { to_user_id: active.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => getSocket().emit("stop_typing", { to_user_id: active.id }), 1200);
  }

  const filtered = contacts.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));
  const online = filtered.filter((c) => onlineUsers.has(c.id));
  const offline = filtered.filter((c) => !onlineUsers.has(c.id));

  const grouped = useMemo(() => {
    const out = [];
    let last = null;
    for (const m of messages) {
      const k = dayKey(m.created_at);
      if (k !== last) { out.push({ separator: k }); last = k; }
      out.push(m);
    }
    return out;
  }, [messages]);

  const ContactRow = (c) => (
    <button key={c.id} onClick={() => openConversation(c)}
      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent ${active?.id === c.id ? "bg-accent" : ""}`}>
      <div className="relative">
        <Avatar className="h-9 w-9">{c.profile_photo && <AvatarImage src={c.profile_photo} />}<AvatarFallback>{initials(c.name)}</AvatarFallback></Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${onlineUsers.has(c.id) ? "bg-green-500" : "bg-gray-400"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{c.name}</span>
          {c.last_message_at && <span className="shrink-0 text-[10px] text-muted-foreground">{timeStr(c.last_message_at)}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{c.last_message || ROLE_LABELS[c.role] || c.role}</span>
          {c.unread_count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{c.unread_count}</span>}
        </div>
      </div>
    </button>
  );

  return (
    <AppShell title={title} allow={allow}>
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-card">
        {/* LEFT */}
        <div className="flex w-80 shrink-0 flex-col border-r">
          <div className="border-b p-3">
            <h2 className="mb-2 font-semibold">Messages</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts" className="pl-8" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isAdmin && (
              <p className="px-2 pb-1 pt-1 text-xs font-semibold text-green-600">Online Now ({online.length})</p>
            )}
            {(isAdmin ? online : filtered).map(ContactRow)}
            {isAdmin && offline.length > 0 && <p className="px-2 pb-1 pt-3 text-xs font-semibold text-muted-foreground">Offline</p>}
            {isAdmin && offline.map(ContactRow)}
            {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No contacts</p>}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-1 flex-col">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b p-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">{active.profile_photo && <AvatarImage src={active.profile_photo} />}<AvatarFallback>{initials(active.name)}</AvatarFallback></Avatar>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${onlineUsers.has(active.id) ? "bg-green-500" : "bg-gray-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{active.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="secondary" className="mr-1">{ROLE_LABELS[active.role] || active.role}</Badge>
                    {onlineUsers.has(active.id) ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4">
                {grouped.map((item, i) => item.separator ? (
                  <div key={`sep-${i}`} className="my-2 text-center"><span className="rounded-full bg-background px-3 py-0.5 text-[11px] text-muted-foreground">{item.separator}</span></div>
                ) : (
                  <Bubble key={item.id} m={item} mine={item.sender_id === user.id} />
                ))}
                {typingFrom && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {active.name} is typing<span className="animate-pulse">…</span>
                  </div>
                )}
              </div>

              <div className="flex items-end gap-2 border-t p-3">
                <textarea value={text} onChange={onType} onKeyDown={onKeyDown} rows={1}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm" />
                <Button onClick={send} disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Bubble({ m, mine }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-background border"}`}>
        <p className="whitespace-pre-wrap break-words">{m.message}</p>
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {timeStr(m.created_at)}
          {mine && (m.is_read ? <CheckCheck className="h-3 w-3 text-sky-300" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  );
}
