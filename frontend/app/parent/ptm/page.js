"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ParentPtmPage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [parentData, sessionData] = await Promise.all([
          api.get("/reports/dashboard/parent"),
          api.get("/ptm/sessions").catch(() => []),
        ]);
        const kids = parentData.children || [];
        setChildren(kids);
        if (kids.length) setActiveId(kids[0].id);
        const sess = Array.isArray(sessionData) ? sessionData : (sessionData?.data || []);
        setSessions(sess);
        if (sess.length) setActiveSession(sess[0].id);
      } catch (e) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, []);

  const loadSlots = useCallback(async (sessionId) => {
    if (!sessionId) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const d = await api.get(`/ptm/slots?session_id=${sessionId}`);
      setSlots(Array.isArray(d) ? d : (d?.data || []));
    } catch (e) {
      toast.error(e.message);
      setSlots([]);
    }
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (activeSession) loadSlots(activeSession);
  }, [activeSession, loadSlots]);

  async function book(slot) {
    try {
      await api.post("/ptm/slots/book", { slot_id: slot.id, student_id: activeId });
      toast.success("Slot booked successfully");
      loadSlots(activeSession);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) {
    return (
      <AppShell title="Parent-Teacher Meetings" allow={["super_admin", "admin", "parent"]}>
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Parent-Teacher Meetings" allow={["super_admin", "admin", "parent"]}>
      {children.length === 0 ? (
        <EmptyState title="No children linked" description="Contact the school to link your child's account." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <Button key={c.id} variant={c.id === activeId ? "default" : "outline"} size="sm" onClick={() => setActiveId(c.id)}>
                {c.name}
              </Button>
            ))}
          </div>

          {sessions.length === 0 ? (
            <EmptyState title="No PTM sessions" description="There are no scheduled parent-teacher meetings yet." />
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Sessions</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {sessions.map((s) => (
                    <Button key={s.id} variant={s.id === activeSession ? "default" : "outline"} size="sm" onClick={() => setActiveSession(s.id)}>
                      {s.title} · {formatDate(s.date)}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Available Slots</CardTitle></CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : slots.length === 0 ? (
                    <EmptyState title="No slots" description="No slots are available for this session." />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {slots.map((slot) => {
                        const booked = slot.is_booked || slot.status === "booked";
                        return (
                          <div key={slot.id} className="rounded-md border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{slot.teacher_name || "Teacher"}</span>
                              {booked && <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">Booked</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(slot.start_time)} – {slot.end_time ? new Date(slot.end_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                            <Button size="sm" className="w-full" disabled={booked} onClick={() => book(slot)}>
                              {booked ? "Unavailable" : "Book"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
