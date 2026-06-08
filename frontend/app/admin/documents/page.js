"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  return (
    <CrudPage
      title="Documents"
      allow={["super_admin", "admin"]}
      endpoint="/documents"
      canEdit
      columns={[
        { key: "title", header: "Title" },
        { key: "category", header: "Category" },
        { key: "file_type", header: "File Type" },
        { key: "created_at", header: "Created", render: (r) => formatDate(r.created_at) },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "file_url", label: "File URL" },
        { name: "category", label: "Category" },
        { name: "file_type", label: "File Type" },
      ]}
    />
  );
}
