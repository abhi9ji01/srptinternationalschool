"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function MessagesPage() {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  async function load() {
    api.get("/messages?box=inbox").then(setInbox).catch(() => {});
    api.get("/messages?box=sent").then(setSent).catch(() => {});
  }
  useEffect(() => { load(); api.get("/messages/contacts").then(setContacts).catch(() => {}); }, []);

  async function send(e) {
    e.preventDefault();
    try { await api.post("/messages", form); toast.success("Sent"); setOpen(false); setForm({}); load(); }
    catch (e) { toast.error(e.message); }
  }

  const List = ({ items, who }) => items.length === 0 ? <EmptyState title="No messages" /> : (
    <div className="space-y-2">
      {items.map((m) => (
        <Card key={m.id}><CardContent className="pt-4">
          <div className="flex justify-between"><p className="font-medium">{m.subject || "(no subject)"}</p><span className="text-xs text-muted-foreground">{formatDateTime(m.sent_at)}</span></div>
          <p className="text-xs text-muted-foreground">{who}: {m.sender_name || m.receiver_name}</p>
          <p className="text-sm mt-1">{m.body}</p>
        </CardContent></Card>
      ))}
    </div>
  );

  return (
    <AppShell title="Messages">
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Send className="h-4 w-4" /> Compose</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
            <form onSubmit={send} className="space-y-3">
              <div className="space-y-2">
                <Label>To</Label>
                <Select value={form.receiver_id} onValueChange={(v) => setForm({ ...form, receiver_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                  <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.role})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Subject</Label><Input value={form.subject || ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea value={form.body || ""} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
              <DialogFooter><Button type="submit">Send</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs defaultValue="inbox">
        <TabsList><TabsTrigger value="inbox">Inbox ({inbox.length})</TabsTrigger><TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger></TabsList>
        <TabsContent value="inbox"><List items={inbox} who="From" /></TabsContent>
        <TabsContent value="sent"><List items={sent} who="To" /></TabsContent>
      </Tabs>
    </AppShell>
  );
}
