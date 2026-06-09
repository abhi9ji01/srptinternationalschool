"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import { stockStatus } from "@/lib/shop";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function ShopProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canDelete = user?.role === "admin" || user?.role === "super_admin";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [delRow, setDelRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await api.get("/shop/products")); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggleActive(p) {
    try { await api.put(`/shop/products/${p.id}`, { is_active: !p.is_active }); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function remove() {
    try { await api.del(`/shop/products/${delRow.id}`); toast.success("Product removed"); setDelRow(null); load(); }
    catch (e) { toast.error(e.message); setDelRow(null); }
  }

  const filtered = products.filter((p) =>
    (tab === "all" || p.type === tab) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Shop Products" allow={ALLOW}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="dress">Dresses</TabsTrigger>
              <TabsTrigger value="course">Courses</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
            <Button onClick={() => router.push("/admin/shop/products/new")}><Plus className="h-4 w-4" /> Add Product</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No products found.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => {
              const ss = stockStatus(p);
              return (
                <Card key={p.id} className="flex flex-col overflow-hidden">
                  <div className="relative h-40 bg-muted/40">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                    <Badge className="absolute left-2 top-2 capitalize" variant="secondary">{p.type}</Badge>
                    {!p.is_active && <Badge className="absolute right-2 top-2" variant="destructive">Inactive</Badge>}
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-1 pt-3">
                    <p className="font-medium leading-tight line-clamp-1">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.category_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatCurrency(p.price)}</span>
                      <span className={`text-xs ${ss.color}`}>{ss.label}</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/admin/shop/products/${p.id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>{p.is_active ? "Hide" : "Show"}</Button>
                      {canDelete && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelRow(p)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!delRow} onOpenChange={(v) => !v && setDelRow(null)} onConfirm={remove}
        title={`Remove "${delRow?.name}"?`} description="The product will be hidden and its images deleted from storage." />
    </AppShell>
  );
}
