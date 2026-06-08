"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function CertificatesPage() {
  return (
    <CrudPage
      title="Certificates"
      allow={["super_admin", "admin"]}
      listEndpoint="/certificates"
      createEndpoint="/certificates"
      endpoint="/certificates"
      canDelete={false}
      columns={[
        { key: "student_name", header: "Student" },
        { key: "type", header: "Type" },
        { key: "certificate_number", header: "Certificate No." },
        { key: "issued_date", header: "Issued", render: (r) => formatDate(r.issued_date) },
      ]}
      fields={[
        {
          name: "student_id",
          label: "Student",
          type: "select",
          optionsEndpoint: "/students",
          optionsValue: "id",
          optionsLabel: (o) => `${o.name} (${o.admission_number})`,
          required: true,
        },
        {
          name: "type",
          label: "Type",
          type: "select",
          options: ["TC", "LC", "migration", "participation", "merit", "sports", "cultural"],
        },
        { name: "remarks", label: "Remarks", type: "textarea" },
      ]}
    />
  );
}
