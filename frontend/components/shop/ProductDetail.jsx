"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, ImageIcon, Minus, Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { stockStatus } from "@/lib/shop";
import { addToCart } from "@/lib/cart";

export default function ProductDetail({ productId, allow, basePath }) {
  const router = useRouter();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get(`/shop/store/${productId}`).then((d) => { setP(d); if (d.sizes?.length) setSize(""); })
      .catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [productId]);

  function buildItem() {
    return { product_id: p.id, name: p.name, price: Number(p.price), type: p.type, size: size || null, quantity: qty, thumbnail: p.thumbnail_url || p.images?.[0] || null };
  }
  function add(redirect) {
    if (p.type === "dress" && p.sizes?.length && !size) return toast.error("Please select a size");
    addToCart(buildItem());
    toast.success("Added to cart");
    if (redirect) router.push(`${basePath}/cart`);
  }

  if (loading) return <AppShell title="Product" allow={allow}><Skeleton className="h-96 w-full" /></AppShell>;
  if (!p) return <AppShell title="Product" allow={allow}><p className="text-muted-foreground">Product not available.</p></AppShell>;

  const ss = stockStatus(p);
  const images = p.images?.length ? p.images : (p.thumbnail_url ? [p.thumbnail_url] : []);

  return (
    <AppShell title={p.name} allow={allow}>
      <div className="mb-4"><Button variant="outline" onClick={() => router.push(basePath)}><ArrowLeft className="h-4 w-4" /> Back to Shop</Button></div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted/30">
            {images[active] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[active]} alt={p.name} className="h-full w-full object-contain" />
            ) : <div className="flex h-full items-center justify-center"><ImageIcon className="h-12 w-12 text-muted-foreground" /></div>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 overflow-hidden rounded border ${i === active ? "ring-2 ring-primary" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{p.type}</Badge>
              <span className={`text-sm ${ss.color}`}>{ss.label}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold">{p.name}</h1>
            <p className="text-2xl font-bold text-primary">{formatCurrency(p.price)}</p>
          </div>
          {p.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p>}

          {p.type === "course" && (
            <Card><CardContent className="grid gap-1 pt-6 text-sm">
              {p.course_duration && <p><span className="text-muted-foreground">Duration: </span>{p.course_duration}</p>}
              {p.course_instructor && <p><span className="text-muted-foreground">Instructor: </span>{p.course_instructor}</p>}
              {p.course_start_date && <p><span className="text-muted-foreground">Starts: </span>{formatDate(p.course_start_date)}</p>}
              {p.course_end_date && <p><span className="text-muted-foreground">Ends: </span>{formatDate(p.course_end_date)}</p>}
            </CardContent></Card>
          )}

          {p.type === "dress" && p.sizes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`rounded border px-4 py-1.5 text-sm ${size === s ? "border-primary bg-primary/10" : ""}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Quantity</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-10 text-center">{qty}</span>
              <Button variant="outline" size="icon" onClick={() => setQty((q) => q + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => add(false)}><ShoppingCart className="h-4 w-4" /> Add to Cart</Button>
            <Button className="flex-1" onClick={() => add(true)}>Buy Now</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
