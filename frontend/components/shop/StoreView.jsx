"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, ImageIcon, Store } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { stockStatus } from "@/lib/shop";
import { cartCount } from "@/lib/cart";

/** Shop storefront. basePath is "/student/shop" or "/parent/shop". */
export default function StoreView({ allow, basePath }) {
  const router = useRouter();
  const [store, setStore] = useState({ all: [], dress: [], course: [], other: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try { setStore(await api.get("/shop/store")); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener("cart-changed", update);
    return () => window.removeEventListener("cart-changed", update);
  }, []);

  const list = (store[tab] || []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="School Shop" allow={allow}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground">
          <Store className="h-9 w-9" />
          <div><h2 className="text-xl font-bold">School Shop</h2><p className="text-sm opacity-90">Uniforms, dresses & courses — order online, collect at school.</p></div>
          <Button variant="secondary" className="ml-auto" onClick={() => router.push(`${basePath}/cart`)}>
            <ShoppingCart className="h-4 w-4" /> Cart {count > 0 && <Badge className="ml-1" variant="destructive">{count}</Badge>}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="dress">Dresses</TabsTrigger>
              <TabsTrigger value="course">Courses</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
        ) : list.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No products available.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => {
              const ss = stockStatus(p);
              return (
                <Card key={p.id} className="flex cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md" onClick={() => router.push(`${basePath}/${p.id}`)}>
                  <div className="h-44 bg-muted/40">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-1 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight line-clamp-2">{p.name}</p>
                      <Badge variant="secondary" className="capitalize shrink-0">{p.type}</Badge>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(p.price)}</span>
                    {p.type === "dress" && p.sizes?.length > 0 && <p className="text-xs text-muted-foreground">Sizes: {p.sizes.join(", ")}</p>}
                    <span className={`text-xs ${ss.color}`}>{ss.label}</span>
                    <Button size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); router.push(`${basePath}/${p.id}`); }}>Buy Now</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
