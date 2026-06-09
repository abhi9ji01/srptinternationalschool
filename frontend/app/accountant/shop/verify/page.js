"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, AlertTriangle, Loader2, User } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { shopStatusColor } from "@/lib/shop";

const ALLOW = ["accountant", "admin", "super_admin"];

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ...verifyResponse }
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState("");
  const [delivering, setDelivering] = useState(false);
  const [recent, setRecent] = useState([]); // session deliveries
  const inputRef = useRef(null);

  async function verify(e) {
    e?.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true); setResult(null); setNotFound(false); setNotes("");
    try {
      const d = await api.post("/shop/verify-code", { purchase_code: c });
      setResult(d);
    } catch (err) {
      setNotFound(true);
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function deliver() {
    setDelivering(true);
    try {
      await api.post("/shop/deliver", { purchase_code: result.item.purchase_code, delivery_notes: notes || null });
      toast.success("Delivered ✓");
      setRecent((r) => [{ code: result.item.purchase_code, product: result.item.product_name, buyer: result.buyer.name, at: new Date().toISOString() }, ...r].slice(0, 10));
      reset();
    } catch (e) { toast.error(e.message); }
    setDelivering(false);
  }

  function reset() {
    setCode(""); setResult(null); setNotFound(false); setNotes("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <AppShell title="Verify Purchase Code" allow={ALLOW}>
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={verify} className="space-y-3 text-center">
              <p className="text-lg font-semibold">Enter Purchase Code</p>
              <Input
                ref={inputRef} autoFocus value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SCH-2025-XXXXXX"
                className="text-center text-lg font-mono tracking-wider h-12"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Verify
              </Button>
            </form>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="border-red-300">
            <CardContent className="flex items-center gap-3 pt-6 text-red-700">
              <XCircle className="h-8 w-8" />
              <div><p className="font-semibold">Invalid Code</p><p className="text-sm">No order found for this code.</p></div>
            </CardContent>
          </Card>
        )}

        {result?.already_delivered && (
          <Card className="border-amber-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertTriangle className="h-8 w-8" />
                <div>
                  <p className="font-semibold">Already Delivered</p>
                  <p className="text-sm">On {formatDateTime(result.delivered_at)}{result.delivered_by_name ? ` by ${result.delivered_by_name}` : ""}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={reset}>Scan next code</Button>
            </CardContent>
          </Card>
        )}

        {result && !result.already_delivered && (
          <Card className="border-green-300">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-6 w-6" /> <span className="font-semibold">Code Verified</span></div>

              <div className="flex items-center gap-3 border-y py-3">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                  {result.buyer.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.buyer.photo} alt="" className="h-full w-full object-cover" />
                  ) : <User className="h-7 w-7 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-semibold">{result.buyer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.buyer.class_name ? `Class ${result.buyer.class_name}${result.buyer.section_name ? `-${result.buyer.section_name}` : ""}` : <span className="capitalize">{result.buyer.buyer_type}</span>}
                    {result.buyer.roll_number ? ` · Roll ${result.buyer.roll_number}` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Product: </span><span className="font-medium">{result.item.product_name}</span></p>
                <p>{result.item.size ? <span><span className="text-muted-foreground">Size: </span>{result.item.size}  </span> : ""}<span className="text-muted-foreground">Qty: </span>{result.item.quantity}</p>
                <p><span className="text-muted-foreground">Price: </span>{formatCurrency(result.item.total_price)}</p>
                <p><span className="text-muted-foreground">Order: </span>{result.item.order_number} · {formatDate(result.item.ordered_at)}</p>
                <p className="flex items-center gap-2"><span className="text-muted-foreground">Status:</span> <Badge className={shopStatusColor(result.item.status)} variant="secondary">{result.item.status}</Badge></p>
              </div>

              <Textarea placeholder="Delivery notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={deliver} disabled={delivering}>
                  {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark as Delivered
                </Button>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {recent.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="mb-2 text-sm font-semibold">Delivered this session</p>
              <div className="space-y-1">
                {recent.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span><span className="font-mono">{r.code}</span> · {r.product}</span>
                    <span className="text-muted-foreground">{r.buyer}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
