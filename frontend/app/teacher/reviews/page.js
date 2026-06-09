"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function StarRow({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export default function TeacherReviewsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reviews/received").then(setData).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const reviews = data?.reviews || [];

  return (
    <AppShell title="My Reviews" allow={["super_admin", "admin", "teacher"]}>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-6 pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-500">{Number(data?.average || 0).toFixed(1)}</p>
                <StarRow value={Math.round(data?.average || 0)} />
                <p className="mt-1 text-xs text-muted-foreground">{data?.count || 0} review(s)</p>
              </div>
              <div className="text-sm text-muted-foreground">
                Average rating from students. Individual reviewers may choose to stay anonymous.
              </div>
            </CardContent>
          </Card>

          {reviews.length === 0 ? (
            <EmptyState title="No reviews yet" description="Student feedback will appear here." />
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Feedback</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <StarRow value={r.rating} />
                      <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      — {r.reviewer_name || "Anonymous"}{r.category ? ` · ${r.category}` : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
