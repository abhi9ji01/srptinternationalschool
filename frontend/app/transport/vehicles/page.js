"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatDate } from "@/lib/utils";

export default function TransportVehiclesPage() {
  return (
    <CrudPage
      title="Vehicles"
      allow={["super_admin", "admin", "transport_manager"]}
      endpoint="/transport/vehicles"
      canEdit
      columns={[
        { key: "vehicle_number", header: "Vehicle No." },
        { key: "vehicle_type", header: "Type" },
        { key: "capacity", header: "Capacity" },
        { key: "driver_name", header: "Driver" },
        { key: "driver_phone", header: "Driver Phone" },
        { key: "insurance_expiry", header: "Insurance Expiry", render: (r) => formatDate(r.insurance_expiry) },
      ]}
      fields={[
        { name: "vehicle_number", label: "Vehicle Number", required: true },
        { name: "vehicle_type", label: "Vehicle Type" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "driver_name", label: "Driver Name" },
        { name: "driver_phone", label: "Driver Phone" },
        { name: "driver_license", label: "Driver License" },
        { name: "insurance_expiry", label: "Insurance Expiry", type: "date" },
        { name: "fitness_expiry", label: "Fitness Expiry", type: "date" },
      ]}
    />
  );
}
