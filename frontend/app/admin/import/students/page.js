"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

export default function ImportStudentsPage() {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/sections-detailed")
      .then((d) => setSections(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, []);

  async function downloadTemplate() {
    try {
      await api.download("/students/import/template", "students_template.xlsx");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function upload() {
    if (!file) {
      toast.error("Please choose a file first");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (sectionId) fd.append("section_id", sectionId);
      const res = await api.upload("/students/import/excel", fd);
      setResult(res);
      toast.success(`Imported ${res.created}, failed ${res.failed}`);
    } catch (e) {
      toast.error(e.message);
    }
    setBusy(false);
  }

  return (
    <AppShell title="Import Students" allow={["super_admin", "admin"]}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Bulk Import Students</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Download the template, fill in student details, then upload the file. Optionally assign all imported
              students to a section.
            </p>
          </div>

          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download Template
          </Button>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div className="space-y-2">
              <Label>File (.xlsx / .csv)</Label>
              <Input type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>Section (optional)</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={upload} disabled={busy}>
            <Upload className="h-4 w-4" /> {busy ? "Uploading..." : "Upload"}
          </Button>

          {result && (
            <div className="space-y-2 border rounded-md p-4 max-w-2xl">
              <p className="text-sm">
                <span className="font-medium text-green-600">Created: {result.created}</span>
                {"  ·  "}
                <span className="font-medium text-red-600">Failed: {result.failed}</span>
              </p>
              {result.errors?.length > 0 && (
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
