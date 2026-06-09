"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ChangePasswordCard from "@/components/shared/ChangePasswordCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/constants";

const ALL = "__all__";

export default function StaffPasswordsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(ALL);
  const [target, setTarget] = useState(null);
  const isSuperAdmin = user?.role === "super_admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = role !== ALL ? `?role=${role}` : "";
      const d = await api.get(`/admin/users${q}`);
      setRows(d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const roleOptions = Array.from(new Set(rows.map((r) => r.role)));

  const columns = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "role", header: "Role", render: (r) => <Badge variant="secondary">{ROLE_LABELS[r.role] || r.role}</Badge> },
    { key: "email", header: "Email" },
    {
      key: "password_changed_at", header: "Last Password Change",
      render: (r) => r.password_changed_at ? new Date(r.password_changed_at).toLocaleString() : <span className="text-muted-foreground">Never</span>,
    },
    {
      key: "_actions", header: "", className: "text-right",
      render: (r) => {
        const locked = r.role === "super_admin" && !isSuperAdmin;
        return (
          <Button size="sm" variant="outline" disabled={locked} onClick={() => setTarget(r)}
            title={locked ? "Only a Super Admin can change a Super Admin's password" : undefined}>
            <KeyRound className="h-4 w-4" /> Reset Password
          </Button>
        );
      },
    },
  ];

  return (
    <AppShell title="Staff Passwords" allow={["super_admin", "admin"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No staff found"
          actions={
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filter by role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                {roleOptions.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />
      </CardContent></Card>

      <Dialog open={!!target} onOpenChange={(v) => { if (!v) { setTarget(null); load(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Reset Password — {target?.name}</DialogTitle></DialogHeader>
          {target && <ChangePasswordCard userId={target.id} userName={target.name} card={false} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
