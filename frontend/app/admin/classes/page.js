"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Settings2, Layers } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [sectionsByClass, setSectionsByClass] = useState({});
  const [loading, setLoading] = useState(true);

  // dialogs
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [quickSection, setQuickSection] = useState(null); // class row
  const [secName, setSecName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/classes");
      const list = Array.isArray(d) ? d : d.data || [];
      setClasses(list);
      const entries = await Promise.all(
        list.map(async (c) => {
          try {
            const s = await api.get(`/classes/${c.id}/sections`);
            return [c.id, Array.isArray(s) ? s : s.data || []];
          } catch { return [c.id, []]; }
        })
      );
      setSectionsByClass(Object.fromEntries(entries));
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addClass(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/classes", { name: className.trim() });
      toast.success("Class created");
      setAddClassOpen(false); setClassName(""); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  async function addQuickSection(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/classes/${quickSection.id}/sections`, { name: secName.trim(), capacity: 40 });
      toast.success(`Section ${secName.trim()} added to ${quickSection.name}`);
      setQuickSection(null); setSecName(""); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  return (
    <AppShell title="Classes" allow={["super_admin", "admin"]}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
              <form onSubmit={addClass} className="space-y-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 10" required />
                </div>
                <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : classes.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No classes yet. Add your first class.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => {
              const sections = sectionsByClass[c.id] || [];
              return (
                <Card key={c.id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />{c.name}</CardTitle>
                    <Badge variant="secondary">{sections.length} section{sections.length === 1 ? "" : "s"}</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                      {sections.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No sections</span>
                      ) : (
                        sections.map((s) => (
                          <Badge key={s.id} variant="outline" title={`${s.student_count || 0} students`}>
                            {s.name} · {Number(s.student_count || 0)}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/admin/classes/${c.id}/sections`)}>
                        <Settings2 className="h-4 w-4" /> Manage Sections
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setQuickSection(c); setSecName(""); }}>
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick add section dialog */}
      <Dialog open={!!quickSection} onOpenChange={(v) => !v && setQuickSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Section to {quickSection?.name}</DialogTitle></DialogHeader>
          <form onSubmit={addQuickSection} className="space-y-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input value={secName} onChange={(e) => setSecName(e.target.value)} placeholder="A" required maxLength={50} />
            </div>
            <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Section"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
