"use client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import CrudPage from "@/components/shared/CrudPage";

export default function TeachersPage() {
  return (
    <CrudPage
      title="Teachers"
      allow={["super_admin", "admin"]}
      endpoint="/teachers"
      canEdit
      columns={[
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "employee_id", header: "Emp. ID" },
        { key: "email", header: "Email" },
        { key: "department", header: "Department" },
        { key: "designation", header: "Designation" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone" },
        { name: "employee_id", label: "Employee ID" },
        { name: "qualification", label: "Qualification" },
        { name: "department", label: "Department" },
        { name: "designation", label: "Designation" },
        { name: "salary", label: "Salary", type: "number" },
      ]}
      rowActions={(r) => (
        <Button asChild size="icon" variant="ghost"><Link href={`/admin/teachers/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
      )}
    />
  );
}
