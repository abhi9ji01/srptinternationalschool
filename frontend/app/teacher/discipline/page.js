"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function DisciplinePage() {
  return (
    <CrudPage
      title="Discipline"
      allow={["super_admin", "admin", "teacher"]}
      endpoint="/discipline"
      listEndpoint="/discipline"
      createEndpoint="/discipline"
      canDelete={false}
      columns={[
        { key: "student_name", header: "Student" },
        { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.type}</span> },
        { key: "category", header: "Category" },
        { key: "incident_date", header: "Date", render: (r) => formatDate(r.incident_date) },
        { key: "description", header: "Description" },
      ]}
      fields={[
        { name: "student_id", label: "Student", type: "select", optionsEndpoint: "/students", optionsValue: "id", optionsLabel: (o) => o.name, required: true },
        { name: "incident_date", label: "Incident Date", type: "date" },
        { name: "type", label: "Type", type: "select", options: ["positive", "negative"] },
        { name: "category", label: "Category" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "action_taken", label: "Action Taken", type: "textarea" },
      ]}
    />
  );
}
