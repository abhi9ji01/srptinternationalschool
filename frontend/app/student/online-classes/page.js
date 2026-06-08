"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Video, PlayCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function StudentOnlineClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        const secId = d?.student?.section_id;
        if (!secId) { setLoading(false); return; }
        try {
          const res = await api.get(`/online-classes?section_id=${secId}`);
          setClasses(Array.isArray(res) ? res : (res.data || []));
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  return (
    <AppShell title="Online Classes" allow={["super_admin", "admin", "student"]}>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : classes.length === 0 ? (
        <Card><CardContent className="pt-6"><EmptyState title="No online classes" description="No classes have been scheduled yet." /></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{c.subject_name || ""}</span>
                  {c.platform && <Badge variant="outline">{c.platform}</Badge>}
                </div>
                <p className="text-muted-foreground">{c.teacher_name || ""}</p>
                <p>{formatDateTime(c.scheduled_at)}</p>
                <div className="flex gap-2 pt-2">
                  {c.meeting_link && (
                    <Button size="sm" asChild>
                      <a href={c.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                    </Button>
                  )}
                  {c.recording_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={c.recording_url} target="_blank" rel="noopener noreferrer">
                        <PlayCircle className="h-4 w-4 mr-1" /> Recording
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
