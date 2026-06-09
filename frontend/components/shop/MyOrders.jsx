"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { shopStatusColor } from "@/lib/shop";

export default function MyOrders({ allow, basePath }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shop/orders/my").then(setOrders).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="My Orders" allow={allow}>
      {loading ? <Skeleton className="h-40 w-full" /> : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Items you order from the school shop appear here.">
          <Button className="mt-3" onClick={() => router.push(basePath)}><Store className="h-4 w-4" /> Browse Shop</Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(`${basePath}/orders/${o.id}`)}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-semibold">{o.order_number}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(o.ordered_at)} · {o.items?.length || 0} item(s)</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{(o.items || []).map((i) => i.product_name).join(", ")}</p>
                </div>
                <div className="text-right">
                  <Badge className={shopStatusColor(o.overall_status)} variant="secondary">{o.overall_status}</Badge>
                  <p className="mt-1 font-bold">{formatCurrency(o.total_amount)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
