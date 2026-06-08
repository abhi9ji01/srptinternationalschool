"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function SchoolsPage() {
  return (
    <CrudPage
      title="Schools"
      allow={["super_admin", "admin"]}
      endpoint="/schools"
      columns={[
        { key: "name", header: "Name" },
        { key: "code", header: "Code" },
        { key: "phone", header: "Phone" },
        { key: "email", header: "Email" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "code", label: "Code" },
        { name: "address", label: "Address" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "website", label: "Website" },
        { name: "principal_name", label: "Principal Name" },
        { name: "affiliation_board", label: "Affiliation Board" },
      ]}
    />
  );
}
