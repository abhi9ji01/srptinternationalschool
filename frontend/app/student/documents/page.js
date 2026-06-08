"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/documents");
        setDocuments(Array.isArray(res) ? res : (res.data || []));
      } catch (e) { toast.error(e.message); }
      try {
        const d = await api.get("/reports/dashboard/student");
        const res = await api.get(`/certificates?student_id=${d.studentId}`);
        setCertificates(Array.isArray(res) ? res : (res.data || []));
      } catch { /* certificates optional */ }
      setLoading(false);
    })();
  }, []);

  const docColumns = [
    { key: "title", header: "Title" },
    { key: "category", header: "Category" },
    { key: "file_type", header: "Type" },
    { key: "created_at", header: "Date", render: (r) => formatDate(r.created_at) },
    { key: "file_url", header: "Action", render: (r) => (
      r.file_url ? (
        <Button size="sm" variant="outline" asChild>
          <a href={r.file_url} target="_blank" rel="noopener noreferrer">View</a>
        </Button>
      ) : <span className="text-muted-foreground text-sm">—</span>
    ) },
  ];

  const certColumns = [
    { key: "type", header: "Type" },
    { key: "certificate_number", header: "Certificate No." },
    { key: "issued_date", header: "Issued", render: (r) => formatDate(r.issued_date) },
    { key: "file_url", header: "Action", render: (r) => (
      r.file_url ? (
        <Button size="sm" variant="outline" asChild>
          <a href={r.file_url} target="_blank" rel="noopener noreferrer">View</a>
        </Button>
      ) : <span className="text-muted-foreground text-sm">—</span>
    ) },
  ];

  return (
    <AppShell title="Documents" allow={["super_admin", "admin", "student"]}>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={docColumns} data={documents} loading={loading} emptyTitle="No documents" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Certificates</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={certColumns} data={certificates} loading={loading} searchable={false} emptyTitle="No certificates" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
