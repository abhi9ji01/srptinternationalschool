"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function HolidaysPage() {
  return (
    <CrudPage
      title="Holidays"
      allow={["super_admin", "admin"]}
      endpoint="/holidays"
      canEdit
      columns={[
        { key: "name", header: "Name" },
        { key: "date", header: "Date", render: (r) => formatDate(r.date) },
        { key: "type", header: "Type" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        {
          name: "type",
          label: "Type",
          type: "select",
          options: ["national", "school", "exam"],
        },
      ]}
    />
  );
}
