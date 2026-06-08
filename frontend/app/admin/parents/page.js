"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function ParentsPage() {
  return (
    <CrudPage
      title="Parents"
      allow={["super_admin", "admin"]}
      listEndpoint="/parents"
      createEndpoint="/parents"
      canDelete={false}
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "student_name", header: "Student" },
        { key: "relation", header: "Relation" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone" },
        { name: "relation", label: "Relation" },
        { name: "occupation", label: "Occupation" },
      ]}
    />
  );
}
