"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function ClassesPage() {
  return (
    <CrudPage
      title="Classes"
      allow={["super_admin", "admin"]}
      endpoint="/classes"
      canEdit
      columns={[{ key: "name", header: "Name" }]}
      fields={[{ name: "name", label: "Name", required: true }]}
    />
  );
}
