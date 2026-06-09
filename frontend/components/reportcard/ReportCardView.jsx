"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { Printer, Download, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import ReportCard from "./ReportCard";
import { nodeToPdf } from "@/components/idcards/pdf";
import { api } from "@/lib/api";

/**
 * Report card viewer. Props:
 *   studentId, academicYearId (default 0 = latest), admin (enables remarks/publish editing).
 */
export default function ReportCardView({ studentId, academicYearId = 0, admin = false }) {
  const ref = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState("style1");
  const [remarks, setRemarks] = useState({ class_teacher_remarks: "", principal_remarks: "", result: "pass", is_published: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const d = await api.get(`/report-cards/${studentId}/${academicYearId}`);
      setData(d);
      setStyle(d.overall?.template_style || "style1");
      setRemarks({
        class_teacher_remarks: d.overall?.class_teacher_remarks || "",
        principal_remarks: d.overall?.principal_remarks || "",
        result: d.overall?.result || "pass",
        is_published: Boolean(d.overall?.is_published),
      });
    } catch (e) { toast.error(e.message); setData(null); }
    setLoading(false);
  }, [studentId, academicYearId]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = useReactToPrint({ content: () => ref.current, documentTitle: `report-card-${data?.student?.name || ""}` });
  async function download() {
    if (!ref.current) return;
    try { await nodeToPdf(ref.current, `report-card-${(data?.student?.name || "student").replace(/\s+/g, "_")}.pdf`); }
    catch { toast.error("PDF export failed"); }
  }

  async function saveRemarks() {
    if (!data?.report_card_id) return toast.error("No published report card to update. Publish it first from the student's exams.");
    setSaving(true);
    try {
      await api.put(`/report-cards/${data.report_card_id}/remarks`, { ...remarks, template_style: style });
      toast.success("Saved");
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  // Live-merge admin edits into the preview without a round-trip.
  const preview = data ? { ...data, overall: { ...data.overall, ...remarks } } : null;

  return (
    <>
      <style jsx global>{`@media print { .no-print { display: none !important; } body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; } }`}</style>

      <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="style1">Classic</SelectItem>
            <SelectItem value="style2">Modern</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={!data}><Printer className="h-4 w-4" /> Print</Button>
          <Button onClick={download} disabled={!data}><Download className="h-4 w-4" /> Download PDF</Button>
        </div>
      </div>

      {admin && data && (
        <Card className="mb-4 no-print">
          <CardHeader><CardTitle className="text-base">Remarks &amp; Publishing</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Class Teacher Remarks</Label>
              <Textarea value={remarks.class_teacher_remarks} onChange={(e) => setRemarks({ ...remarks, class_teacher_remarks: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Principal Remarks</Label>
              <Textarea value={remarks.principal_remarks} onChange={(e) => setRemarks({ ...remarks, principal_remarks: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select value={remarks.result} onValueChange={(v) => setRemarks({ ...remarks, result: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pass", "fail", "promoted", "detained"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Published (visible to student)</Label>
              <Select value={remarks.is_published ? "yes" : "no"} onValueChange={(v) => setRemarks({ ...remarks, is_published: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button onClick={saveRemarks} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-auto rounded-md border bg-muted/30 p-4">
        {loading ? (
          <div className="space-y-3 max-w-3xl mx-auto"><Skeleton className="h-16 w-full" /><Skeleton className="h-64 w-full" /></div>
        ) : !preview ? (
          <EmptyState title="Report card unavailable" description="It may not be published yet." />
        ) : (
          <div className="print-area mx-auto w-fit bg-white shadow">
            <ReportCard ref={ref} data={preview} style={style} />
          </div>
        )}
      </div>
    </>
  );
}
