"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import MultiImageUpload from "./MultiImageUpload";
import { api } from "@/lib/api";
import { DRESS_SIZES } from "@/lib/shop";

const ALLOW = ["super_admin", "admin", "accountant"];
const empty = {
  name: "", description: "", price: "", category_id: "", type: "dress", is_active: true,
  stock_quantity: 0, is_unlimited_stock: false, sizes: [],
  course_duration: "", course_start_date: "", course_end_date: "", course_instructor: "",
};

export default function ProductForm({ productId }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState([]); // [{url, public_id}]
  const [categories, setCategories] = useState([]);
  const [customSize, setCustomSize] = useState("");
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", type: "dress" });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const loadCategories = () => api.get("/shop/categories").then(setCategories).catch(() => {});
  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (!productId) return;
    api.get(`/shop/products/${productId}`).then((p) => {
      setForm({
        name: p.name || "", description: p.description || "", price: p.price || "",
        category_id: p.category_id ? String(p.category_id) : "", type: p.type || "dress",
        is_active: !!p.is_active, stock_quantity: p.stock_quantity || 0, is_unlimited_stock: !!p.is_unlimited_stock,
        sizes: p.sizes || [], course_duration: p.course_duration || "",
        course_start_date: p.course_start_date || "", course_end_date: p.course_end_date || "",
        course_instructor: p.course_instructor || "",
      });
      const imgs = (p.images || []).map((url, i) => ({ url, public_id: (p.cloudinary_public_ids || [])[i] || "" }));
      setImages(imgs);
      setLoading(false);
    }).catch((e) => { toast.error(e.message); setLoading(false); });
  }, [productId]);

  const filteredCategories = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  function toggleSize(s) {
    set("sizes", form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s]);
  }

  async function createCategory(e) {
    e.preventDefault();
    try {
      await api.post("/shop/categories", { name: newCat.name, type: newCat.type });
      toast.success("Category created");
      setCatOpen(false); setNewCat({ name: "", type: form.type });
      await loadCategories();
    } catch (e) { toast.error(e.message); }
  }

  async function save(e) {
    e.preventDefault();
    if (!form.name || form.price === "" || !form.category_id) return toast.error("Name, price and category are required");
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, price: Number(form.price),
        category_id: Number(form.category_id), type: form.type, is_active: form.is_active,
        is_unlimited_stock: form.is_unlimited_stock,
        stock_quantity: form.is_unlimited_stock ? 0 : Number(form.stock_quantity) || 0,
        images: images.map((i) => i.url),
        cloudinary_public_ids: images.map((i) => i.public_id),
        thumbnail_url: images[0]?.url || null,
        sizes: form.type === "dress" ? form.sizes : null,
        course_duration: form.type === "course" ? form.course_duration : null,
        course_start_date: form.type === "course" ? (form.course_start_date || null) : null,
        course_end_date: form.type === "course" ? (form.course_end_date || null) : null,
        course_instructor: form.type === "course" ? form.course_instructor : null,
      };
      if (productId) { await api.put(`/shop/products/${productId}`, payload); toast.success("Product updated"); }
      else { await api.post("/shop/products", payload); toast.success("Product created"); }
      router.push("/admin/shop/products");
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  return (
    <AppShell title={productId ? "Edit Product" : "New Product"} allow={ALLOW}>
      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <form onSubmit={save} className="max-w-3xl space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => { set("type", v); set("category_id", ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dress">Dress</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No {form.type} categories</div>}
                      {filteredCategories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => { setNewCat({ name: "", type: form.type }); setCatOpen(true); }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Product Name</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Checkbox id="active" checked={form.is_active} onCheckedChange={(v) => set("is_active", !!v)} />
                <Label htmlFor="active">Active (visible in shop)</Label>
              </div>
            </CardContent>
          </Card>

          {form.type !== "course" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Stock {form.type === "dress" ? "& Sizes" : ""}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="unlimited" checked={form.is_unlimited_stock} onCheckedChange={(v) => set("is_unlimited_stock", !!v)} />
                  <Label htmlFor="unlimited">Unlimited stock</Label>
                </div>
                {!form.is_unlimited_stock && (
                  <div className="space-y-2 max-w-xs">
                    <Label>Stock Quantity</Label>
                    <Input type="number" min={0} value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} />
                  </div>
                )}
                {form.type === "dress" && (
                  <div className="space-y-2">
                    <Label>Available Sizes</Label>
                    <div className="flex flex-wrap gap-2">
                      {DRESS_SIZES.map((s) => (
                        <label key={s} className={`cursor-pointer rounded border px-3 py-1 text-sm ${form.sizes.includes(s) ? "border-primary bg-primary/10" : ""}`}>
                          <input type="checkbox" className="sr-only" checked={form.sizes.includes(s)} onChange={() => toggleSize(s)} />
                          {s}
                        </label>
                      ))}
                      {form.sizes.filter((s) => !DRESS_SIZES.includes(s)).map((s) => (
                        <label key={s} className="cursor-pointer rounded border border-primary bg-primary/10 px-3 py-1 text-sm" onClick={() => toggleSize(s)}>{s} ✕</label>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-xs">
                      <Input placeholder="Custom size" value={customSize} onChange={(e) => setCustomSize(e.target.value)} />
                      <Button type="button" variant="outline" onClick={() => { const s = customSize.trim().toUpperCase(); if (s && !form.sizes.includes(s)) set("sizes", [...form.sizes, s]); setCustomSize(""); }}>Add</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {form.type === "course" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Course Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Duration</Label><Input placeholder="e.g. 3 Months" value={form.course_duration} onChange={(e) => set("course_duration", e.target.value)} /></div>
                <div className="space-y-2"><Label>Instructor</Label><Input value={form.course_instructor} onChange={(e) => set("course_instructor", e.target.value)} /></div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.course_start_date} onChange={(e) => set("course_start_date", e.target.value)} /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.course_end_date} onChange={(e) => set("course_end_date", e.target.value)} /></div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox id="unlimited2" checked={form.is_unlimited_stock} onCheckedChange={(v) => set("is_unlimited_stock", !!v)} />
                  <Label htmlFor="unlimited2">Unlimited enrollment</Label>
                </div>
                {!form.is_unlimited_stock && (
                  <div className="space-y-2 max-w-xs"><Label>Seats</Label><Input type="number" min={0} value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} /></div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Images</CardTitle></CardHeader>
            <CardContent><MultiImageUpload value={images} onChange={setImages} max={5} /></CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Product"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/shop/products")}>Cancel</Button>
          </div>
        </form>
      )}

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <form onSubmit={createCategory} className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newCat.type} onValueChange={(v) => setNewCat({ ...newCat, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="dress">Dress</SelectItem><SelectItem value="course">Course</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="submit">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
