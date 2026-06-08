"use client";
import { Badge } from "@/components/ui/badge";
import CrudPage from "@/components/shared/CrudPage";

export default function AssignTeachersPage() {
  return (
    <CrudPage
      title="Teacher Assignments"
      allow={["super_admin", "admin"]}
      listEndpoint="/teachers/assignments/all"
      createEndpoint="/teachers/assign"
      deleteEndpoint={(row) => `/teachers/assign/${row.id}`}
      columns={[
        { key: "teacher_name", header: "Teacher", render: (r) => <span className="font-medium">{r.teacher_name}</span> },
        { key: "class_name", header: "Class", render: (r) => `${r.class_name || "—"} ${r.section_name || ""}` },
        { key: "subject_name", header: "Subject", render: (r) => r.subject_name || "—" },
        {
          key: "role", header: "Role",
          render: (r) => <Badge variant={r.role === "class_teacher" ? "default" : "secondary"}>
            {r.role === "class_teacher" ? "Class Teacher" : "Subject Teacher"}
          </Badge>,
        },
      ]}
      fields={[
        {
          name: "teacher_id", label: "Teacher", type: "select", required: true,
          optionsEndpoint: "/teachers", optionsValue: "id", optionsLabel: (o) => `${o.name} (${o.employee_id || "—"})`,
        },
        {
          name: "section_id", label: "Class / Section", type: "select", required: true,
          optionsEndpoint: "/sections-detailed", optionsValue: "id", optionsLabel: (o) => `${o.class_name} ${o.section_name}`,
        },
        {
          name: "subject_id", label: "Subject (optional for class teacher)", type: "select",
          optionsEndpoint: "/subjects-detailed", optionsValue: "id", optionsLabel: (o) => `${o.name}${o.class_name ? ` · ${o.class_name}` : ""}`,
        },
        {
          name: "role", label: "Role", type: "select",
          options: [{ id: "subject_teacher", name: "Subject Teacher" }, { id: "class_teacher", name: "Class Teacher" }],
        },
      ]}
      defaultForm={{ role: "subject_teacher" }}
    />
  );
}
