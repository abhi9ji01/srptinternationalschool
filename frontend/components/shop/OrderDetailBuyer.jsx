"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check, CheckCircle2, Download } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { shopStatusColor } from "@/lib/shop";
import { nodeToPdf } from "@/components/idcards/pdf";

export default function OrderDetailBuyer({ orderId, allow, basePath }) {
  const router = useRouter();
  const ref = useRef(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api.get(`/shop/orders/my/${orderId}`).then(setOrder).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [orderId]);

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setCopied(code); toast.success("Code copied"); setTimeout(() => setCopied((c) => (c === code ? "" : c)), 1500); }
    catch { toast.error("Copy failed"); }
  }
  async function downloadReceipt() {
    if (!ref.current) return;
    try { await nodeToPdf(ref.current, `${order.order_number}.pdf`); }
    catch { toast.error("PDF export failed"); }
  }

  if (loading) return <AppShell title="Order" allow={allow}><Skeleton className="h-96 w-full" /></AppShell>;
  if (!order) return <AppShell title="Order" allow={allow}><p className="text-muted-foreground">Order not found.</p></AppShell>;

  return (
    <AppShell title={order.order_number} allow={allow}>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`${basePath}/orders`)}><ArrowLeft className="h-4 w-4" /> My Orders</Button>
        <Button variant="outline" onClick={downloadReceipt}><Download className="h-4 w-4" /> Download Receipt</Button>
      </div>

      <div ref={ref} className="mx-auto max-w-2xl space-y-4 bg-background">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Order {order.order_number}</CardTitle>
              <p className="text-sm text-muted-foreground">Placed {formatDate(order.ordered_at)}</p>
            </div>
            <Badge className={shopStatusColor(order.overall_status)} variant="secondary">{order.overall_status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((it, idx) => (
              <div key={it.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">Item {idx + 1}: {it.product_name}</p>
                    <p className="text-sm text-muted-foreground">{it.size ? `Size: ${it.size} · ` : ""}Qty: {it.quantity} · {formatCurrency(it.total_price)}</p>
                  </div>
                  <Badge className={shopStatusColor(it.status)} variant="secondary">{it.status}</Badge>
                </div>

                {it.status === "delivered" ? (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm">Delivered{it.delivered_at ? ` on ${formatDateTime(it.delivered_at)}` : ""}</span>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your Purchase Code</p>
                    <p className="my-1 text-2xl font-bold tracking-widest">{it.purchase_code}</p>
                    <Button size="sm" variant="outline" onClick={() => copy(it.purchase_code)}>
                      {copied === it.purchase_code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === it.purchase_code ? "Copied" : "Copy"}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">Show this code to the accountant to collect your item.</p>
                  </div>
                )}
              </div>
            ))}

            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.total_amount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Payment</span><span className="uppercase">{order.payment_mode} · {order.payment_status}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
