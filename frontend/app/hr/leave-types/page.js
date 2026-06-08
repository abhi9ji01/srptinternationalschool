"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function LeaveTypesPage() {
  return (
    <CrudPage
      title="Leave Types"
      allow={["super_admin", "admin", "hr_manager"]}
      endpoint="/hr/leave-types"
      canEdit
      columns={[
        { key: "name", header: "Name" },
        { key: "days_allowed", header: "Days Allowed" },
        { key: "is_paid", header: "Paid", render: (r) => (Number(r.is_paid) ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "days_allowed", label: "Days Allowed", type: "number" },
        {
          name: "is_paid",
          label: "Paid",
          type: "select",
          options: [
            { id: 1, name: "Paid" },
            { id: 0, name: "Unpaid" },
          ],
        },
      ]}
    />
  );
}
