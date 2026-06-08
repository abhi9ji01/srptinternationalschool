"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function SubmitDialog({ assignment, onDone }) {
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const res = await api.post(`/assignments/${assignment.id}/submit`, { file_url: fileUrl });
      toast.success(res?.late ? "Submitted (late)" : "Submitted");
      setOpen(false);
      setFileUrl("");
      onDone && onDone();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Submit</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit: {assignment.title}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="file_url">Submission link/URL</Label>
          <Input id="file_url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/reports/dashboard/student")
      .then(async (d) => {
        const secId = d?.student?.section_id;
        if (!secId) { setLoading(false); return; }
        try {
          const res = await api.get(`/assignments?section_id=${secId}`);
          setAssignments(Array.isArray(res) ? res : (res.data || []));
        } catch (e) { toast.error(e.message); }
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { key: "title", header: "Title" },
    { key: "subject_name", header: "Subject" },
    { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
    { key: "total_marks", header: "Marks" },
    { key: "id", header: "Action", render: (r) => <SubmitDialog assignment={r} onDone={load} /> },
  ];

  return (
    <AppShell title="Assignments" allow={["super_admin", "admin", "student"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={assignments} loading={loading} emptyTitle="No assignments" />
      </CardContent></Card>
    </AppShell>
  );
}
