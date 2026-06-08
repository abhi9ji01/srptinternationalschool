"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function NoticeBoardPage() {
  return (
    <CrudPage
      title="Notice Board"
      allow={["super_admin", "admin"]}
      endpoint="/notice-board"
      canEdit
      columns={[
        { key: "title", header: "Title" },
        { key: "category", header: "Category" },
        { key: "created_at", header: "Created", render: (r) => formatDate(r.created_at) },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "content", label: "Content", type: "textarea", required: true },
        { name: "category", label: "Category" },
      ]}
    />
  );
}
