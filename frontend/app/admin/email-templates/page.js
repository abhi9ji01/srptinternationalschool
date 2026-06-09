"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Send, Mail } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { api } from "@/lib/api";
import { TEMPLATE_TYPES } from "@/components/email/TemplateEditor";

const ALL = "__all__";

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(ALL);
  const [delRow, setDelRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = type !== ALL ? `?type=${type}` : "";
      const d = await api.get(`/email-templates${q}`);
      setRows(d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load]);

  async function sendTest(id) {
    try { const r = await api.post(`/email-templates/${id}/send-test`, {}); toast.success(r.message || "Test sent"); }
    catch (e) { toast.error(e.message); }
  }
  async function remove() {
    try { await api.del(`/email-templates/${delRow.id}`); toast.success("Deleted"); setDelRow(null); load(); }
    catch (e) { toast.error(e.message); setDelRow(null); }
  }

  return (
    <AppShell title="Email Templates" allow={["super_admin", "admin"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {TEMPLATE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/admin/email-templates/new")}><Plus className="h-4 w-4" /> New Template</Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No templates yet. Create your first one.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((t) => (
              <Card key={t.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{t.name}</CardTitle>
                    <Badge variant="secondary">{t.type.replace(/_/g, " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">Last edited {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : "—"}</p>
                  <div className="mt-auto flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/admin/email-templates/${t.id}/edit`)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="icon" variant="ghost" title="Send test" onClick={() => sendTest(t.id)}><Send className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" title="Delete" onClick={() => setDelRow(t)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!delRow} onOpenChange={(v) => !v && setDelRow(null)} onConfirm={remove}
        title={`Delete "${delRow?.name}"?`} description="This template will be permanently removed." />
    </AppShell>
  );
}
