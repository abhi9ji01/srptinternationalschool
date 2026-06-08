"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function BackupPage() {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      await api.download("/backup/export", "backup.zip");
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error(e.message);
    }
    setBusy(false);
  }

  return (
    <AppShell title="Backup" allow={["super_admin", "admin"]}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Data Backup</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Download a ZIP archive containing Excel exports of key tables (students, teachers, fee payments,
              attendance and exam marks) for your school.
            </p>
          </div>
          <Button onClick={download} disabled={busy}>
            <Download className="h-4 w-4" /> {busy ? "Preparing..." : "Download Backup (ZIP)"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
