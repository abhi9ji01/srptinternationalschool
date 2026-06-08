"use client";
import CrudPage from "@/components/shared/CrudPage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AcademicYearsPage() {
  return (
    <CrudPage
      title="Academic Years"
      allow={["super_admin", "admin"]}
      endpoint="/academic-years"
      canEdit
      columns={[
        { key: "name", header: "Name" },
        { key: "start_date", header: "Start Date", render: (r) => formatDate(r.start_date) },
        { key: "end_date", header: "End Date", render: (r) => formatDate(r.end_date) },
        { key: "is_current", header: "Current", render: (r) => (r.is_current ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "end_date", label: "End Date", type: "date" },
      ]}
      rowActions={(row, reload) =>
        !row.is_current && (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await api.post(`/academic-years/${row.id}/set-current`);
                toast.success("Set as current");
                reload();
              } catch (e) {
                toast.error(e.message);
              }
            }}
          >
            Set current
          </Button>
        )
      }
    />
  );
}
