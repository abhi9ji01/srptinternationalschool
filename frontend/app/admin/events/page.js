"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function EventsPage() {
  return (
    <CrudPage
      title="Events"
      allow={["super_admin", "admin"]}
      endpoint="/events"
      canEdit
      columns={[
        { key: "title", header: "Title" },
        { key: "type", header: "Type" },
        { key: "event_date", header: "Date", render: (r) => formatDate(r.event_date) },
        { key: "venue", header: "Venue" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "event_date", label: "Event Date", type: "date" },
        {
          name: "type",
          label: "Type",
          type: "select",
          options: ["academic", "sports", "cultural", "exam", "holiday", "other"],
        },
        { name: "venue", label: "Venue" },
      ]}
    />
  );
}
