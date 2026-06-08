"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function FeeStructurePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ class_id: "", fee_category_id: "", amount: "", due_date: "" });

  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", frequency: "monthly" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/fees/structure");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const [c, fc] = await Promise.all([api.get("/classes"), api.get("/fees/categories")]);
      setClasses(Array.isArray(c) ? c : c.data || []);
      setCategories(Array.isArray(fc) ? fc : fc.data || []);
    } catch (e) { toast.error(e.message); }
  }, []);

  useEffect(() => { load(); loadOptions(); }, [load, loadOptions]);

  async function createStructure(e) {
    e.preventDefault();
    try {
      await api.post("/fees/structure", {
        class_id: form.class_id,
        fee_category_id: form.fee_category_id,
        amount: form.amount,
        due_date: form.due_date || null,
      });
      toast.success("Fee structure created");
      setOpen(false);
      setForm({ class_id: "", fee_category_id: "", amount: "", due_date: "" });
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function createCategory(e) {
    e.preventDefault();
    try {
      await api.post("/fees/categories", { name: catForm.name, frequency: catForm.frequency });
      toast.success("Category created");
      setCatOpen(false);
      setCatForm({ name: "", frequency: "monthly" });
      loadOptions();
    } catch (e) { toast.error(e.message); }
  }

  async function remove(id) {
    try {
      await api.del(`/fees/structure/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "class_name", header: "Class" },
    { key: "category_name", header: "Category" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    { key: "due_date", header: "Due Date", render: (r) => formatDate(r.due_date) },
    { key: "frequency", header: "Frequency" },
    {
      key: "_actions", header: "", className: "text-right", render: (r) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Fee Structure" allow={ALLOW}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No fee structures yet"
          actions={
            <>
              <Dialog open={catOpen} onOpenChange={setCatOpen}>
                <DialogTrigger asChild><Button variant="outline">New Category</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Fee Category</DialogTitle></DialogHeader>
                  <form onSubmit={createCategory} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={catForm.frequency} onValueChange={(v) => setCatForm({ ...catForm, frequency: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="one_time">One Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter><Button type="submit">Create</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Fee Structure</DialogTitle></DialogHeader>
                  <form onSubmit={createStructure} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={form.class_id ? String(form.class_id) : ""} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fee Category</Label>
                      <Select value={form.fee_category_id ? String(form.fee_category_id) : ""} onValueChange={(v) => setForm({ ...form, fee_category_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                    </div>
                    <DialogFooter><Button type="submit">Create</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
