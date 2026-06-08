"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function PtmPage() {
  return (
    <CrudPage
      title="PTM Sessions"
      allow={["super_admin", "admin"]}
      listEndpoint="/ptm/sessions"
      createEndpoint="/ptm/sessions"
      canDelete={false}
      columns={[
        { key: "title", header: "Title" },
        { key: "date", header: "Date", render: (r) => formatDate(r.date) },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "date", label: "Date", type: "date", required: true },
      ]}
    />
  );
}
