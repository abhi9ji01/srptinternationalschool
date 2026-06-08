"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { api } from "@/lib/api";

export default function StudentQrCodePage() {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        try {
          const res = await api.get(`/students/${d.studentId}/qr-code`);
          setQr(res);
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  return (
    <AppShell title="My QR Code" allow={["super_admin", "admin", "student"]}>
      <Card className="max-w-md mx-auto">
        <CardHeader><CardTitle className="text-base text-center">Attendance QR Code</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          {loading ? (
            <Skeleton className="h-56 w-56" />
          ) : !qr?.dataUrl ? (
            <EmptyState title="No QR code" description="Your QR code is not available." />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.dataUrl} alt="Attendance QR code" className="h-56 w-56 rounded-md border" />
              <p className="mt-4 text-xs font-mono break-all text-muted-foreground">{qr.token}</p>
              <p className="mt-4 text-sm text-muted-foreground">Show this to your teacher for attendance</p>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
