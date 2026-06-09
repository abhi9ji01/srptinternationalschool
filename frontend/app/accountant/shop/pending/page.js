"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const ALLOW = ["accountant", "admin", "super_admin"];

export default function PendingPickupsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get("/shop/pending")); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function deliver(code) {
    try { await api.post("/shop/deliver", { purchase_code: code }); toast.success("Delivered"); load(); }
    catch (e) { toast.error(e.message); }
  }

  const today = [], older = [];
  for (const r of rows) (Number(r.days_waiting) === 0 ? today : older).push(r);

  const Group = ({ title, items }) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{title} ({items.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">None</p> : items.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm">
            <div>
              <p className="font-medium">{r.product_name} {r.size ? <span className="text-muted-foreground">· {r.size}</span> : ""} <span className="text-muted-foreground">×{r.quantity}</span></p>
              <p className="text-muted-foreground">{r.buyer_name} · {r.order_number} · {formatDate(r.ordered_at)}</p>
              <p className="font-mono text-xs">{r.purchase_code}</p>
            </div>
            <div className="flex items-center gap-2">
              {Number(r.days_waiting) > 0 && <Badge variant="secondary">{r.days_waiting}d waiting</Badge>}
              <Button size="sm" onClick={() => deliver(r.purchase_code)}><CheckCircle2 className="h-4 w-4" /> Deliver</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <AppShell title="Pending Pickups" allow={ALLOW}>
      {loading ? <Skeleton className="h-40 w-full" /> : (
        <div className="space-y-4">
          <Group title="Today's Pending" items={today} />
          <Group title="Older" items={older} />
        </div>
      )}
    </AppShell>
  );
}
