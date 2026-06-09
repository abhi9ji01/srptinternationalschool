"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)} className="transition-transform hover:scale-110">
          <Star className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function StudentReviewsPage() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({}); // id -> {rating, comment, is_anonymous}

  async function load() {
    setLoading(true);
    try {
      const d = await api.get("/reviews/targets");
      setTargets(Array.isArray(d) ? d : []);
      const seed = {};
      (d || []).forEach((t) => { seed[t.id] = { rating: t.my_rating || 0, comment: t.my_comment || "", is_anonymous: false }; });
      setDraft(seed);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const set = (id, patch) => setDraft((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  async function submit(t) {
    const d = draft[t.id] || {};
    if (!d.rating) return toast.error("Pick a star rating");
    try {
      await api.post("/reviews", { target_user_id: t.id, rating: d.rating, comment: d.comment, is_anonymous: d.is_anonymous });
      toast.success(`Review saved for ${t.name}`);
      load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Rate My Teachers" allow={["super_admin", "admin", "student"]}>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : targets.length === 0 ? (
        <EmptyState title="No teachers to review" description="Teachers assigned to your class will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {targets.map((t) => {
            const d = draft[t.id] || {};
            return (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t.designation || "Teacher"}{t.subjects ? ` · ${t.subjects}` : ""}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Stars value={d.rating || 0} onChange={(r) => set(t.id, { rating: r })} />
                  <Textarea placeholder="Optional feedback…" value={d.comment || ""} onChange={(e) => set(t.id, { comment: e.target.value })} rows={2} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`anon-${t.id}`} checked={!!d.is_anonymous} onCheckedChange={(v) => set(t.id, { is_anonymous: !!v })} />
                      <Label htmlFor={`anon-${t.id}`} className="text-xs">Submit anonymously</Label>
                    </div>
                    <Button size="sm" onClick={() => submit(t)}>{t.my_rating ? "Update" : "Submit"}</Button>
                  </div>
                  {t.my_rating ? <p className="text-xs text-green-600">You rated {t.my_rating}/5</p> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
