"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function QrAttendancePage() {
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ token: null, at: 0 });
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [log, setLog] = useState([]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  async function markToken(token) {
    if (!token) return;
    try {
      const res = await api.post("/attendance/qr-scan", { token });
      const name = res.student?.name || "Student";
      toast.success(`${name} marked ${res.status}`);
      setLog((l) => [{ name, status: res.status, at: new Date().toLocaleTimeString() }, ...l].slice(0, 20));
    } catch (e) {
      toast.error(e.message || "Scan failed");
    }
  }

  async function onDecoded(decodedText) {
    const now = Date.now();
    // debounce duplicate scans of same token within 3s
    if (lastScanRef.current.token === decodedText && now - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { token: decodedText, at: now };
    await markToken(decodedText);
  }

  async function start() {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode("reader");
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onDecoded,
        () => {} // ignore per-frame decode errors
      );
      setScanning(true);
    } catch (e) {
      toast.error(e?.message || "Could not start camera");
    }
  }

  async function stop() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      // ignore
    }
    setScanning(false);
  }

  async function markManual() {
    if (!manualToken.trim()) return toast.error("Enter a token");
    await markToken(manualToken.trim());
    setManualToken("");
  }

  return (
    <AppShell title="QR Attendance" allow={["super_admin", "admin", "teacher"]}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Scan QR Code</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div id="reader" className="w-full rounded-md border bg-muted/30 min-h-[260px]" />
            <div className="flex gap-2">
              {!scanning ? (
                <Button onClick={start}>Start Scanning</Button>
              ) : (
                <Button variant="destructive" onClick={stop}>Stop Scanning</Button>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Manual token (fallback)</Label>
              <div className="flex gap-2">
                <Input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Paste QR token"
                  onKeyDown={(e) => { if (e.key === "Enter") markManual(); }} />
                <Button variant="outline" onClick={markManual}>Mark</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Scans</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {log.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans yet.</p>
            ) : log.map((e, i) => (
              <div key={i} className="flex items-center justify-between border rounded-md p-2 text-sm">
                <span className="font-medium">{e.name}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{e.status}</Badge>
                  <span className="text-xs text-muted-foreground">{e.at}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
