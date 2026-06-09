"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getCart, updateCart, removeFromCart, clearCart } from "@/lib/cart";

export default function CartView({ allow, basePath }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [placing, setPlacing] = useState(false);

  const refresh = () => setItems(getCart());
  useEffect(() => {
    refresh();
    window.addEventListener("cart-changed", refresh);
    return () => window.removeEventListener("cart-changed", refresh);
  }, []);

  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);

  async function placeOrder() {
    if (!items.length) return;
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, size: i.size || null })),
        payment_mode: paymentMode,
      };
      const res = await api.post("/shop/orders", payload);
      clearCart();
      toast.success(`Order ${res.order_number} placed!`);
      router.push(`${basePath}/orders/${res.order_id}`);
    } catch (e) { toast.error(e.message); }
    setPlacing(false);
  }

  return (
    <AppShell title="Cart" allow={allow}>
      {items.length === 0 ? (
        <EmptyState title="Your cart is empty" description="Browse the shop and add items." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((it, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="h-16 w-16 overflow-hidden rounded border bg-muted/30">
                    {it.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{it.type}{it.size ? ` · Size ${it.size}` : ""}</p>
                    <p className="text-sm font-semibold">{formatCurrency(it.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => updateCart(i, { quantity: Math.max(1, it.quantity - 1) })}><Minus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center">{it.quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => updateCart(i, { quantity: it.quantity + 1 })}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFromCart(i)}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit">
            <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Payment Mode</p>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={placeOrder} disabled={placing}><ShoppingCart className="h-4 w-4" /> {placing ? "Placing..." : "Place Order"}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
