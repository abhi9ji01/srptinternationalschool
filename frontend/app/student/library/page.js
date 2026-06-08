"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function StudentLibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/library/books");
        setBooks(Array.isArray(res) ? res : (res.data || []));
      } catch (e) { toast.error(e.message); }
      setLoading(false);
    })();
  }, []);

  const columns = [
    { key: "title", header: "Title" },
    { key: "author", header: "Author" },
    { key: "category", header: "Category" },
    { key: "available_copies", header: "Available", render: (r) => (
      <Badge variant="secondary" className={Number(r.available_copies) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {r.available_copies ?? 0}
      </Badge>
    ) },
  ];

  return (
    <AppShell title="Library Catalog" allow={["super_admin", "admin", "student"]}>
      <Card><CardContent className="pt-6">
        <DataTable columns={columns} data={books} loading={loading} emptyTitle="No books in catalog" />
      </CardContent></Card>
    </AppShell>
  );
}
