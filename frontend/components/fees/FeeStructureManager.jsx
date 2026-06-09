"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, History, Save, Layers } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];
const ALL = "__all__";

export default function FeeStructureManager({ isAdmin }) {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const [catFilter, setCatFilter] = useState(ALL);
  const [classFilter, setClassFilter] = useState(ALL);
  const [yearFilter, setYearFilter] = useState(ALL);

  const [edits, setEdits] = useState({});         // id -> { amount, due_date }
  const [selected, setSelected] = useState(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [catDialog, setCatDialog] = useState(null); // null | "new" | category row
  const [delRow, setDelRow] = useState(null);
  const [historyRow, setHistoryRow] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [bulkAmountOpen, setBulkAmountOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (classFilter !== ALL) q.set("class_id", classFilter);
      if (yearFilter !== ALL) q.set("academic_year_id", yearFilter);
      const d = await api.get(`/fees/structure${q.toString() ? `?${q}` : ""}`);
      setRows(Array.isArray(d) ? d : d.data || []);
      setEdits({}); setSelected(new Set());
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [classFilter, yearFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/fees/categories").then((d) => setCategories(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/classes").then((d) => setClasses(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/academic-years").then((d) => setYears(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  const visible = useMemo(() => rows.filter((r) => catFilter === ALL || String(r.fee_category_id) === catFilter), [rows, catFilter]);
  const pendingIds = Object.keys(edits).filter((id) => {
    const r = rows.find((x) => String(x.id) === String(id));
    if (!r) return false;
    const e = edits[id];
    return (e.amount !== undefined && String(e.amount) !== String(r.amount)) || (e.due_date !== undefined && (e.due_date || "") !== (r.due_date || ""));
  });

  function setEdit(id, patch) { setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })); }
  function valFor(r, field) { const e = edits[r.id]; return e && e[field] !== undefined ? e[field] : (r[field] ?? ""); }

  async function saveOne(id, confirm) {
    const r = rows.find((x) => String(x.id) === String(id)); if (!r) return true;
    const e = edits[id] || {};
    const body = { amount: e.amount !== undefined ? Number(e.amount) : r.amount, due_date: e.due_date !== undefined ? e.due_date : r.due_date };
    if (confirm) body.confirm = true;
    const res = await api.put(`/fees/structure/${id}`, body);
    return !res?.warning; // false → needs confirm
  }

  async function saveAll(force) {
    const withInvoices = pendingIds.some((id) => Number(rows.find((r) => String(r.id) === String(id))?.invoice_count || 0) > 0);
    if (withInvoices && !force) { setConfirmSave(true); return; }
    try {
      for (const id of pendingIds) await saveOne(id, true);
      toast.success("Changes saved");
      setConfirmSave(false); load();
    } catch (e) { toast.error(e.message); }
  }

  async function openHistory(r) {
    setHistoryRow(r);
    try { setHistoryData(await api.get(`/fees/structure/${r.id}/history`)); } catch { setHistoryData([]); }
  }

  async function deleteStructure(confirm) {
    try {
      await api.del(`/fees/structure/${delRow.id}${confirm ? "?confirm=1" : ""}`);
      toast.success("Deleted"); setDelRow(null); load();
    } catch (e) { toast.error(e.message); }
  }

  function toggleSel(id) { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function bulkUpdateAmount() {
    try {
      await api.put("/fees/structure/bulk-update", { ids: [...selected], amount: Number(bulkAmount) });
      toast.success("Updated"); setBulkAmountOpen(false); setBulkAmount(""); load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title="Fee Structure" allow={ALLOW}>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* LEFT: categories */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <button onClick={() => setCatFilter(ALL)} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent ${catFilter === ALL ? "bg-accent" : ""}`}>
              <span>All categories</span>
            </button>
            {categories.map((c) => (
              <div key={c.id} className={`flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent ${catFilter === String(c.id) ? "bg-accent" : ""}`}>
                <button onClick={() => setCatFilter(String(c.id))} className="flex-1 text-left">{c.name}</button>
                <Badge variant="secondary" className="mr-1 text-[10px]">{c.frequency}</Badge>
                {isAdmin && (
                  <>
                    <button onClick={() => setCatDialog(c)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteCategory(c)} className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            ))}
            {isAdmin && <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setCatDialog("new")}><Plus className="h-4 w-4" /> Add Category</Button>}
          </CardContent>
        </Card>

        {/* RIGHT: structures */}
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Academic year" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All years</SelectItem>{years.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All classes</SelectItem>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                {selected.size > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setBulkAmountOpen(true)}>Update Amount ({selected.size})</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setBulkAddOpen(true)}>Bulk Add</Button>
                <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Fee</Button>
              </div>
            </div>

            {pendingIds.length > 0 && (
              <div className="flex items-center justify-between rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                <span>{pendingIds.length} unsaved change(s)</span>
                <Button size="sm" onClick={() => saveAll(false)}><Save className="h-4 w-4" /> Save All Changes</Button>
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  {isAdmin && <TableHead className="w-8"></TableHead>}
                  <TableHead>Class</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead><TableHead>Year</TableHead><TableHead>Invoices</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Loading…</TableCell></TableRow>
                  ) : visible.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No fee structures</TableCell></TableRow>
                  ) : visible.map((r) => {
                    const dirty = pendingIds.includes(String(r.id));
                    return (
                      <TableRow key={r.id} className={dirty ? "bg-yellow-50" : ""}>
                        {isAdmin && <TableCell><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} /></TableCell>}
                        <TableCell>{r.class_name}</TableCell>
                        <TableCell>{r.category_name}</TableCell>
                        <TableCell>
                          <Input type="number" value={valFor(r, "amount")} onChange={(e) => setEdit(r.id, { amount: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") saveAll(false); if (e.key === "Escape") setEdits((p) => { const n = { ...p }; delete n[r.id]; return n; }); }}
                            className="h-8 w-28" />
                        </TableCell>
                        <TableCell>
                          <Input type="date" value={(valFor(r, "due_date") || "").slice(0, 10)} onChange={(e) => setEdit(r.id, { due_date: e.target.value })} className="h-8 w-36" />
                        </TableCell>
                        <TableCell>{r.academic_year || "—"}</TableCell>
                        <TableCell>{Number(r.invoice_count) > 0 ? <Badge variant="secondary">{r.invoice_count}</Badge> : "0"}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button size="icon" variant="ghost" title="History" onClick={() => openHistory(r)}><History className="h-4 w-4" /></Button>
                          {isAdmin && <Button size="icon" variant="ghost" className="text-destructive" title="Delete" onClick={() => setDelRow(r)}><Trash2 className="h-4 w-4" /></Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddFeeDialog open={addOpen} onOpenChange={setAddOpen} classes={classes} categories={categories} years={years} onSaved={load} />
      <BulkAddDialog open={bulkAddOpen} onOpenChange={setBulkAddOpen} classes={classes} categories={categories} years={years} onSaved={load} />
      {isAdmin && <CategoryDialog dialog={catDialog} onOpenChange={setCatDialog} onSaved={() => api.get("/fees/categories").then((d) => setCategories(Array.isArray(d) ? d : d.data || []))} />}

      {/* History sheet */}
      <Sheet open={!!historyRow} onOpenChange={(v) => !v && setHistoryRow(null)}>
        <SheetContent className="w-96">
          <SheetHeader><SheetTitle>Change History</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2">
            {historyData.length === 0 ? <p className="text-sm text-muted-foreground">No changes recorded.</p> :
              historyData.map((h) => (
                <div key={h.id} className="rounded border p-2 text-sm">
                  <p className="text-xs text-muted-foreground">{formatDate(h.changed_at)} · {h.changed_by_name || "—"}</p>
                  <p>Amount: {formatCurrency(h.old_amount)} → <b>{formatCurrency(h.new_amount)}</b></p>
                  {h.old_due_date !== h.new_due_date && <p>Due: {formatDate(h.old_due_date)} → {formatDate(h.new_due_date)}</p>}
                  {h.reason && <p className="text-muted-foreground">{h.reason}</p>}
                </div>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <Dialog open={!!delRow} onOpenChange={(v) => !v && setDelRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete fee structure?</DialogTitle>
            <DialogDescription>
              {Number(delRow?.invoice_count || 0) > 0
                ? `${delRow?.invoice_count} invoice(s) exist for this fee. Paid invoices will block deletion.`
                : "This fee structure will be permanently removed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteStructure(Number(delRow?.invoice_count || 0) > 0)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk amount */}
      <Dialog open={bulkAmountOpen} onOpenChange={setBulkAmountOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update amount for {selected.size} fee(s)</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>New Amount (₹)</Label><Input type="number" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} /></div>
          <DialogFooter><Button onClick={bulkUpdateAmount} disabled={!bulkAmount}>Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save-all warning */}
      <Dialog open={confirmSave} onOpenChange={setConfirmSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Some fees have invoices</DialogTitle>
            <DialogDescription>Existing invoices won&apos;t change. Update the fee structure anyway?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSave(false)}>Cancel</Button>
            <Button onClick={() => saveAll(true)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );

  async function deleteCategory(c) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try { await api.del(`/fees/categories/${c.id}`); toast.success("Category deleted"); api.get("/fees/categories").then((d) => setCategories(Array.isArray(d) ? d : d.data || [])); }
    catch (e) { toast.error(e.message); }
  }
}

function AddFeeDialog({ open, onOpenChange, classes, categories, years, onSaved }) {
  const [f, setF] = useState({ class_id: "", fee_category_id: "", amount: "", due_date: "", academic_year_id: "" });
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/fees/structure", { ...f, academic_year_id: f.academic_year_id || null, due_date: f.due_date || null });
      toast.success("Fee added"); onOpenChange(false); setF({ class_id: "", fee_category_id: "", amount: "", due_date: "", academic_year_id: "" }); onSaved();
    } catch (e) { toast.error(e.message); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Fee Structure</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Class"><Select value={f.class_id} onValueChange={(v) => setF({ ...f, class_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Category"><Select value={f.fee_category_id} onValueChange={(v) => setF({ ...f, fee_category_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Academic Year"><Select value={f.academic_year_id} onValueChange={(v) => setF({ ...f, academic_year_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Amount (₹)"><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></Field>
          <Field label="Due Date"><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
          <DialogFooter><Button type="submit">Create</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkAddDialog({ open, onOpenChange, classes, categories, years, onSaved }) {
  const [sel, setSel] = useState(new Set());
  const [f, setF] = useState({ fee_category_id: "", amount: "", due_date: "", academic_year_id: "" });
  function toggle(id) { setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  async function submit(e) {
    e.preventDefault();
    if (!sel.size) return toast.error("Select at least one class");
    try {
      await api.post("/fees/structure/bulk", { class_ids: [...sel], fee_category_id: f.fee_category_id, amount: Number(f.amount), due_date: f.due_date || null, academic_year_id: f.academic_year_id || null });
      toast.success("Fees created"); onOpenChange(false); setSel(new Set()); setF({ fee_category_id: "", amount: "", due_date: "", academic_year_id: "" }); onSaved();
    } catch (e) { toast.error(e.message); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Bulk Add Fee (multiple classes)</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Classes</Label>
            <div className="flex flex-wrap gap-2 rounded border p-2 max-h-32 overflow-auto">
              {classes.map((c) => (
                <label key={c.id} className={`cursor-pointer rounded border px-2 py-1 text-sm ${sel.has(c.id) ? "border-primary bg-primary/10" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={sel.has(c.id)} onChange={() => toggle(c.id)} />{c.name}
                </label>
              ))}
            </div>
          </div>
          <Field label="Category"><Select value={f.fee_category_id} onValueChange={(v) => setF({ ...f, fee_category_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Academic Year"><Select value={f.academic_year_id} onValueChange={(v) => setF({ ...f, academic_year_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Amount (₹)"><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></Field>
          <Field label="Due Date"><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
          <DialogFooter><Button type="submit">Create for {sel.size} class(es)</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({ dialog, onOpenChange, onSaved }) {
  const editing = dialog && dialog !== "new";
  const [f, setF] = useState({ name: "", frequency: "monthly", description: "" });
  useEffect(() => { if (editing) setF({ name: dialog.name || "", frequency: dialog.frequency || "monthly", description: dialog.description || "" }); else setF({ name: "", frequency: "monthly", description: "" }); }, [dialog]);
  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/fees/categories/${dialog.id}`, f);
      else await api.post("/fees/categories", f);
      toast.success("Saved"); onOpenChange(null); onSaved();
    } catch (e) { toast.error(e.message); }
  }
  return (
    <Dialog open={!!dialog} onOpenChange={(v) => !v && onOpenChange(null)}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="Frequency">
            <Select value={f.frequency} onValueChange={(v) => setF({ ...f, frequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["monthly", "quarterly", "yearly", "one_time"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <DialogFooter><Button type="submit">Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}
