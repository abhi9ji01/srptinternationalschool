"use client";
import CrudPage from "@/components/shared/CrudPage";

export default function StaffPage() {
  return (
    <CrudPage
      title="Staff"
      allow={["super_admin", "admin"]}
      listEndpoint="/hr/staff"
      createEndpoint="/hr/staff"
      canDelete={false}
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "role", header: "Role" },
        { key: "department", header: "Department" },
        { key: "designation", header: "Designation" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone" },
        {
          name: "role",
          label: "Role",
          type: "select",
          options: [
            "accountant",
            "librarian",
            "hr_manager",
            "hostel_warden",
            "transport_manager",
            "security_guard",
            "canteen_manager",
            "health_officer",
          ],
        },
        { name: "department", label: "Department" },
        { name: "designation", label: "Designation" },
        { name: "employee_id", label: "Employee ID" },
        { name: "basic_salary", label: "Basic Salary", type: "number" },
      ]}
    />
  );
}
