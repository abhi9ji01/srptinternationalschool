"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { shopStatusColor } from "@/lib/shop";

const ALLOW = ["super_admin", "admin", "accountant"];
const ALL = "__all__";
const STATUSES = ["pending", "confirmed", "partially_delivered", "completed", "cancelled"];

export default function ShopOrdersPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (status !== ALL) q.set("status", status);
      if (type !== ALL) q.set("type", type);
      if (from) q.set("date_from", from);
      if (to) q.set("date_to", to);
      setRows(await api.get(`/shop/orders${q.toString() ? `?${q}` : ""}`));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [status, type, from, to]);
  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "order_number", header: "Order #", render: (r) => <span className="font-medium">{r.order_number}</span> },
    { key: "buyer_name", header: "Buyer" },
    { key: "buyer_type", header: "Type", render: (r) => <span className="capitalize">{r.buyer_type}</span> },
    { key: "items_count", header: "Items" },
    { key: "total_amount", header: "Total", render: (r) => formatCurrency(r.total_amount) },
    { key: "payment_mode", header: "Payment", render: (r) => <span className="uppercase text-xs">{r.payment_mode}</span> },
    { key: "overall_status", header: "Status", render: (r) => <Badge className={shopStatusColor(r.overall_status)} variant="secondary">{r.overall_status}</Badge> },
    { key: "ordered_at", header: "Date", render: (r) => formatDate(r.ordered_at) },
    { key: "_a", header: "", className: "text-right", render: (r) => <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/shop/orders/${r.id}`)}><Eye className="h-4 w-4" /> View</Button> },
  ];

  return (
    <AppShell title="Shop Orders" allow={ALLOW}>
      <Card><CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-end gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>All types</SelectItem><SelectItem value="dress">Dress</SelectItem><SelectItem value="course">Course</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
          </Select>
          <div><label className="text-xs text-muted-foreground">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" /></div>
          <div><label className="text-xs text-muted-foreground">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" /></div>
        </div>
        <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No orders" />
      </CardContent></Card>
    </AppShell>
  );
}
