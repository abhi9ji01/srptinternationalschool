"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, Loader2, Mail, MessageSquare } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, API_URL, getToken } from "@/lib/api";
import { useSchool } from "@/contexts/SchoolContext";

const GENERAL_FIELDS = [
  { name: "name", label: "School Name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "website", label: "Website" },
  { name: "address", label: "Address", full: true },
  { name: "established_year", label: "Established Year", type: "number" },
  { name: "principal_name", label: "Principal Name" },
  { name: "affiliation_board", label: "Affiliation Board (CBSE/ICSE/State/IB)" },
];

export default function SettingsPage() {
  const { school, refresh, setSchool } = useSchool();
  const [form, setForm] = useState({});
  const [grades, setGrades] = useState([]);
  const [period, setPeriod] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInput = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get("/settings");
        setForm(d.school || {});
        setGrades(d.grades || []);
        setPeriod(d.periodSettings || {});
      } catch (e) { toast.error(e.message); }
      setLoading(false);
    })();
  }, []);

  async function saveGeneral(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      [...GENERAL_FIELDS.map((f) => f.name), "primary_color", "secondary_color"].forEach((k) => { payload[k] = form[k] ?? ""; });
      await api.put("/settings", payload);
      toast.success("Settings saved");
      setSchool({ ...school, ...payload });
      refresh();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  function uploadLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) return toast.error("Logo must be under 1MB");
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/settings/logo`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    setLogoUploading(true);
    xhr.onload = () => {
      setLogoUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setForm((f) => ({ ...f, logo_url: data.logo_url }));
          setSchool({ ...school, logo_url: data.logo_url });
          refresh();
          toast.success("Logo updated");
        } else toast.error(data.error || "Logo upload failed");
      } catch { toast.error("Logo upload failed"); }
    };
    xhr.onerror = () => { setLogoUploading(false); toast.error("Logo upload failed"); };
    xhr.send(fd);
  }

  async function testEmail() {
    try { const r = await api.post("/settings/test-email", {}); toast.success(r.message || "Sent"); }
    catch (e) { toast.error(e.message); }
  }
  async function testSms() {
    try { const r = await api.post("/settings/test-sms", {}); toast.success(r.message || "Sent"); }
    catch (e) { toast.error(e.message); }
  }

  const primary = form.primary_color || "#2563eb";
  const secondary = form.secondary_color || "#1e293b";

  return (
    <AppShell title="Settings" allow={["super_admin", "admin"]}>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general">
          <Card><CardContent className="pt-6">
            <form onSubmit={saveGeneral} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {GENERAL_FIELDS.map((f) => (
                <div key={f.name} className={`space-y-2 ${f.full ? "sm:col-span-2" : ""}`}>
                  <Label>{f.label}</Label>
                  <Input type={f.type || "text"} value={form[f.name] ?? ""} disabled={loading}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving || loading}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </CardContent></Card>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">School Logo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-md border bg-muted/40 flex items-center justify-center overflow-hidden">
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo_url} alt="logo" className="h-full w-full object-contain" />
                    ) : <span className="text-xs text-muted-foreground">No logo</span>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => logoInput.current?.click()} disabled={logoUploading}>
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Logo
                  </Button>
                  <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                </div>
                <p className="text-xs text-muted-foreground">Used in: navbar, report cards, ID cards, emails. Max 1MB.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Brand Colors</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="color" value={primary} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-14 rounded border" />
                  <div className="flex-1"><Label>Primary Color</Label><Input value={primary} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={secondary} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-14 rounded border" />
                  <div className="flex-1"><Label>Secondary Color</Label><Input value={secondary} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} /></div>
                </div>
                <Button onClick={saveGeneral} disabled={saving}>{saving ? "Saving..." : "Save Appearance"}</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden max-w-md">
                  <div className="flex items-center gap-3 p-4" style={{ backgroundColor: primary, color: "#fff" }}>
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo_url} alt="logo" className="h-10 w-10 rounded bg-white/90 object-contain p-0.5" />
                    ) : <div className="h-10 w-10 rounded bg-white/20" />}
                    <div>
                      <p className="font-semibold leading-tight">{form.name || "School Name"}</p>
                      <p className="text-xs opacity-90">{form.affiliation_board || "Affiliation Board"}</p>
                    </div>
                  </div>
                  <div className="p-4 text-sm" style={{ borderTop: `3px solid ${secondary}` }}>
                    Sample ID card / report card header using your brand colors.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Email (SMTP)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                SMTP credentials are configured on the server via environment variables
                (<code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>SMTP_FROM</code>).
                Use the button below to verify delivery.
              </p>
              <div className="flex gap-2">
                <Button onClick={testEmail} variant="outline">Send Test Email</Button>
                <Button asChild variant="secondary"><Link href="/admin/email-templates">Manage Email Templates</Link></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> SMS Provider</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                SMS is sent via Twilio or MSG91, configured on the server via environment variables.
                Use the button below to send a test SMS to your registered phone number.
              </p>
              <Button onClick={testSms} variant="outline">Send Test SMS</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACADEMIC */}
        <TabsContent value="academic">
          <Card>
            <CardHeader><CardTitle className="text-base">Grade Configuration</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Grade</TableHead><TableHead>Min %</TableHead><TableHead>Max %</TableHead>
                    <TableHead>Grade Point</TableHead><TableHead>Remark</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {grades.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No grades configured</TableCell></TableRow>
                    ) : grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>{g.grade_name}</TableCell>
                        <TableCell>{g.min_percentage}</TableCell>
                        <TableCell>{g.max_percentage}</TableCell>
                        <TableCell>{g.grade_point ?? "—"}</TableCell>
                        <TableCell>{g.remark || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Period durations — before lunch: {period?.before_lunch_duration ?? "—"} min, after lunch: {period?.after_lunch_duration ?? "—"} min.
                Manage period timings on the Timetable settings page.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
