"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDateTime } from "@/lib/utils";

export default function OnlineClassesPage() {
  return (
    <CrudPage
      title="Online Classes"
      allow={["super_admin", "admin", "teacher"]}
      endpoint="/online-classes"
      listEndpoint="/online-classes"
      createEndpoint="/online-classes"
      columns={[
        { key: "title", header: "Title" },
        { key: "platform", header: "Platform", render: (r) => <span className="capitalize">{(r.platform || "").replace("_", " ")}</span> },
        { key: "section_name", header: "Section" },
        { key: "scheduled_at", header: "Scheduled At", render: (r) => formatDateTime(r.scheduled_at) },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "meeting_link", label: "Meeting Link", required: true },
        { name: "platform", label: "Platform", type: "select", options: ["google_meet", "zoom", "teams"] },
        { name: "section_id", label: "Section", type: "select", optionsEndpoint: "/sections-detailed", optionsValue: "id", optionsLabel: (o) => `${o.class_name} ${o.section_name}` },
        { name: "scheduled_at", label: "Scheduled At", type: "datetime-local" },
        { name: "duration_minutes", label: "Duration", type: "number" },
      ]}
    />
  );
}
