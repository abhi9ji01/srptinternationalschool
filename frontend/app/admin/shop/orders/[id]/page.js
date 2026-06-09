"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { shopStatusColor } from "@/lib/shop";

const ALLOW = ["super_admin", "admin", "accountant"];
const STATUSES = ["pending", "confirmed", "partially_delivered", "completed", "cancelled"];

export default function ShopOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrder(await api.get(`/shop/orders/${id}`)); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function setOverall(status) {
    try { await api.put(`/shop/orders/${id}/status`, { overall_status: status }); toast.success("Status updated"); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function deliverItem(code) {
    try { await api.post("/shop/deliver", { purchase_code: code }); toast.success("Marked delivered"); load(); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Order Detail" allow={ALLOW}>
      <div className="mb-4 flex items-center justify-between no-print">
        <Button asChild variant="outline"><Link href="/admin/shop/orders"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
      </div>
      <style jsx global>{`@media print { .no-print { display: none !important } }`}</style>

      {loading || !order ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="space-y-4 print-area">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Order {order.order_number}</CardTitle>
              <Badge className={shopStatusColor(order.overall_status)} variant="secondary">{order.overall_status}</Badge>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Buyer: </span><span className="font-medium">{order.buyer_name}</span> ({order.buyer_type})</div>
              <div><span className="text-muted-foreground">Contact: </span>{order.buyer_email || order.buyer_phone || "—"}</div>
              <div><span className="text-muted-foreground">Placed: </span>{formatDate(order.ordered_at)}</div>
              <div><span className="text-muted-foreground">Payment: </span><span className="uppercase">{order.payment_mode}</span> · {order.payment_status}</div>
              <div className="sm:col-span-2 flex items-center gap-2 no-print">
                <span className="text-muted-foreground">Update overall status:</span>
                <Select value={order.overall_status} onValueChange={setOverall}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{it.product_name} {it.size ? <span className="text-muted-foreground">· Size {it.size}</span> : ""}</p>
                    <p className="text-sm text-muted-foreground">Qty {it.quantity} · {formatCurrency(it.unit_price)} each · {formatCurrency(it.total_price)}</p>
                    <p className="mt-1 font-mono text-sm">{it.purchase_code}</p>
                    {it.delivered_at && <p className="text-xs text-green-600">Delivered {formatDateTime(it.delivered_at)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={shopStatusColor(it.status)} variant="secondary">{it.status}</Badge>
                    {it.status !== "delivered" && it.status !== "cancelled" && (
                      <Button size="sm" variant="outline" className="no-print" onClick={() => deliverItem(it.purchase_code)}><CheckCircle2 className="h-4 w-4" /> Deliver</Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t pt-3 text-lg font-bold">Total: {formatCurrency(order.total_amount)}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
