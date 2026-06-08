"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function GenerateInvoicesPage() {
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classId, setClassId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const [c, fc] = await Promise.all([api.get("/classes"), api.get("/fees/categories")]);
      setClasses(Array.isArray(c) ? c : c.data || []);
      setCategories(Array.isArray(fc) ? fc : fc.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  async function generate() {
    if (!classId || !categoryId) return toast.error("Select class and fee category");
    setSubmitting(true);
    try {
      const res = await api.post("/fees/invoices/generate-bulk", { class_id: classId, fee_category_id: categoryId });
      if (res.error) toast.error(res.error);
      else toast.success(`Generated ${res.created ?? 0} invoice(s)`);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  return (
    <AppShell title="Generate Invoices" allow={ALLOW}>
      <Card className="max-w-xl">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fee Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select fee category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={submitting || loading}>
            {submitting ? "Generating..." : "Generate Invoices"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
