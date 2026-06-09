"use client";
import { useRef, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Send, Save } from "lucide-react";
import "react-quill/dist/quill.snow.css";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export const TEMPLATE_TYPES = [
  "welcome", "fee_receipt", "fee_reminder", "attendance_alert", "marks_published",
  "exam_schedule", "password_reset", "announcement", "custom",
];

export const AVAILABLE_VARS = [
  "student_name", "parent_name", "class_name", "section_name", "school_name", "school_logo",
  "fee_amount", "due_date", "receipt_number", "exam_date", "subject_name", "marks_obtained",
  "total_marks", "grade", "teacher_name", "password", "login_url", "current_date",
];

const SAMPLE = {
  student_name: "Aarav Sharma", parent_name: "Mr. Rajesh Sharma", class_name: "Class 10",
  section_name: "A", school_name: "SRPT International School", school_logo: "",
  fee_amount: "₹12,500", due_date: "2025-07-15", receipt_number: "RCPT-2025-001",
  exam_date: "2025-07-01", subject_name: "Mathematics", marks_obtained: "85", total_marks: "100",
  grade: "A", teacher_name: "Mrs. Priya Nair", password: "Temp@1234",
  login_url: "http://localhost:3000/login", current_date: "2025-06-09",
};

function render(html, values) {
  return (html || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (values[k] != null ? String(values[k]) : ""));
}

const modules = {
  toolbar: [
    [{ font: [] }, { size: [] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

/** Shared create/edit form for email templates. `templateId` => edit mode. */
export default function TemplateEditor({ templateId }) {
  const router = useRouter();
  const quillRef = useRef(null);
  const [form, setForm] = useState({ name: "", subject: "", type: "custom", html_body: "" });
  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    api.get(`/email-templates/${templateId}`).then((t) => {
      setForm({ name: t.name, subject: t.subject, type: t.type, html_body: t.html_body });
      setLoading(false);
    }).catch((e) => { toast.error(e.message); setLoading(false); });
  }, [templateId]);

  // Detect which variables are used so we can persist them.
  const usedVars = useMemo(() => {
    const found = new Set();
    const re = /\{\{\s*(\w+)\s*\}\}/g;
    let m;
    const hay = `${form.subject} ${form.html_body}`;
    while ((m = re.exec(hay))) found.add(m[1]);
    return [...found];
  }, [form.subject, form.html_body]);

  function insertVar(name) {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) { setForm((f) => ({ ...f, html_body: f.html_body + ` {{${name}}}` })); return; }
    const range = editor.getSelection(true);
    editor.insertText(range ? range.index : editor.getLength(), `{{${name}}}`, "user");
  }

  async function save() {
    if (!form.name || !form.subject) return toast.error("Name and subject are required");
    setSaving(true);
    try {
      const payload = { ...form, variables: usedVars };
      if (templateId) { await api.put(`/email-templates/${templateId}`, payload); toast.success("Template updated"); }
      else { await api.post("/email-templates", payload); toast.success("Template created"); }
      router.push("/admin/email-templates");
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  async function sendTest() {
    if (!templateId) return toast.error("Save the template first, then send a test");
    try { const r = await api.post(`/email-templates/${templateId}/send-test`, {}); toast.success(r.message || "Test sent"); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <AppShell title={templateId ? "Edit Email Template" : "New Email Template"} allow={["super_admin", "admin"]}>
      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <Card><CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Template Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fee Reminder" /></div>
              <div className="space-y-2"><Label>Template Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMPLATE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-2 sm:col-span-2"><Label>Email Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Welcome to {{school_name}}" /></div>
            </CardContent></Card>

            <Card><CardContent className="pt-6">
              <Label className="mb-2 block">Email Body</Label>
              <div className="quill-tall">
                <ReactQuill ref={quillRef} theme="snow" modules={modules}
                  value={form.html_body} onChange={(v) => setForm({ ...form, html_body: v })} />
              </div>
            </CardContent></Card>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4" /> Preview</Button>
              <Button variant="secondary" onClick={sendTest}><Send className="h-4 w-4" /> Send Test Email</Button>
            </div>
          </div>

          {/* Variables panel */}
          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader><CardTitle className="text-sm">Variables</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">Click to insert at cursor.</p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARS.map((v) => (
                  <button key={v} type="button" onClick={() => insertVar(v)}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">{`{{${v}}}`}</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Preview (sample data)</DialogTitle></DialogHeader>
          <p className="text-sm font-medium">Subject: {render(form.subject, SAMPLE)}</p>
          <div className="rounded-md border p-4 max-h-[60vh] overflow-auto" dangerouslySetInnerHTML={{ __html: render(form.html_body, SAMPLE) }} />
        </DialogContent>
      </Dialog>

      <style jsx global>{`.quill-tall .ql-container{min-height:500px;font-size:14px}.quill-tall .ql-editor{min-height:500px}`}</style>
    </AppShell>
  );
}
