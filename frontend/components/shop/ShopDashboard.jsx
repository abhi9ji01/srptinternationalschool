"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Package, ShoppingBag, Clock, IndianRupee, AlertTriangle, GraduationCap } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { shopStatusColor } from "@/lib/shop";

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShopDashboard({ allow, basePath = "/admin/shop" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shop/reports").then(setData).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell title="Shop Dashboard" allow={allow}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div></AppShell>;

  const pc = data?.product_counts || {};
  return (
    <AppShell title="Shop Dashboard" allow={allow}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Package} label="Dress Products" value={pc.dress || 0} sub={`${pc.other || 0} other items`} />
          <Stat icon={GraduationCap} label="Course Products" value={pc.course || 0} />
          <Stat icon={ShoppingBag} label="Orders Today" value={data?.orders_today || 0} sub={`${data?.total_orders || 0} all-time`} />
          <Stat icon={IndianRupee} label="Revenue (Month)" value={formatCurrency(data?.month_revenue)} sub={`${formatCurrency(data?.total_revenue)} all-time`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat icon={Clock} label="Pending Pickups" value={data?.pending_pickups || 0} sub="Confirmed, not delivered" />
          <Stat icon={ShoppingBag} label="Delivered Today" value={data?.delivered_today || 0} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Buyer</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(data?.recent_orders || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No orders yet</TableCell></TableRow>
                  ) : data.recent_orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell><Link href={`${basePath}/orders/${o.id}`} className="text-primary hover:underline">{o.order_number}</Link></TableCell>
                      <TableCell>{o.buyer_name}</TableCell>
                      <TableCell>{formatCurrency(o.total_amount)}</TableCell>
                      <TableCell><Badge className={shopStatusColor(o.overall_status)} variant="secondary">{o.overall_status}</Badge></TableCell>
                      <TableCell>{formatDate(o.ordered_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data?.low_stock || []).length === 0 ? <p className="text-sm text-muted-foreground">All products well stocked.</p> :
                data.low_stock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span className="truncate">{p.name}</span>
                    <Badge variant="destructive">{p.stock_quantity} left</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
