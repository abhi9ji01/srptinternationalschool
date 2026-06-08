"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function SubjectsPage() {
  return (
    <CrudPage
      title="Subjects"
      allow={["super_admin", "admin"]}
      listEndpoint="/subjects-detailed"
      endpoint="/subjects"
      canEdit
      columns={[
        { key: "name", header: "Name" },
        { key: "code", header: "Code" },
        { key: "class_name", header: "Class" },
        { key: "teacher_name", header: "Teacher" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "code", label: "Code" },
        {
          name: "class_id",
          label: "Class",
          type: "select",
          optionsEndpoint: "/classes",
          optionsValue: "id",
          optionsLabel: (o) => o.name,
          required: true,
        },
        {
          name: "teacher_id",
          label: "Subject Teacher",
          type: "select",
          optionsEndpoint: "/teachers",
          optionsValue: "user_id",
          optionsLabel: (o) => o.name,
        },
      ]}
    />
  );
}
