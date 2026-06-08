"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatCurrency } from "@/lib/utils";

export default function TransportRoutesPage() {
  return (
    <CrudPage
      title="Routes"
      allow={["super_admin", "admin", "transport_manager"]}
      endpoint="/transport/routes"
      canEdit
      columns={[
        { key: "route_name", header: "Route" },
        { key: "start_point", header: "Start" },
        { key: "end_point", header: "End" },
        { key: "distance_km", header: "Distance (km)" },
        { key: "monthly_charge", header: "Monthly Charge", render: (r) => formatCurrency(r.monthly_charge) },
      ]}
      fields={[
        { name: "route_name", label: "Route Name", required: true },
        { name: "start_point", label: "Start Point" },
        { name: "end_point", label: "End Point" },
        { name: "stops", label: "Stops", type: "textarea" },
        { name: "distance_km", label: "Distance (km)", type: "number" },
        { name: "monthly_charge", label: "Monthly Charge", type: "number" },
      ]}
    />
  );
}
