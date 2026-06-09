"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

function StarRow({ value }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />)}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // {user, data}

  useEffect(() => {
    api.get("/reviews/summary").then((d) => setRows(Array.isArray(d) ? d : [])).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  async function open(row) {
    setDetail({ user: row, data: null });
    try { const d = await api.get(`/reviews/about/${row.id}`); setDetail({ user: row, data: d }); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Employee Reviews" allow={["super_admin", "admin", "hr_manager"]}>
      <Card><CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No reviews yet" description="Ratings submitted by students/parents will appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => open(r)}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{ROLE_LABELS?.[r.role] || r.role}</TableCell>
                  <TableCell><span className="mr-2 font-semibold">{Number(r.average).toFixed(1)}</span><StarRow value={r.average} /></TableCell>
                  <TableCell>{r.reviews}</TableCell>
                  <TableCell className="text-right text-xs text-primary underline">View</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.user?.name} — {Number(detail?.user?.average || 0).toFixed(1)} ★ ({detail?.user?.reviews} reviews)</DialogTitle></DialogHeader>
          {!detail?.data ? <Skeleton className="h-24 w-full" /> : (
            <div className="space-y-2">
              {(detail.data.reviews || []).map((r) => (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <StarRow value={r.rating} />
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    — {r.is_anonymous ? `${r.reviewer_name} (anonymous to employee)` : r.reviewer_name} · {ROLE_LABELS?.[r.reviewer_role] || r.reviewer_role}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
