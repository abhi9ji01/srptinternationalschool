"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatCurrency } from "@/lib/utils";

export default function CanteenMenuPage() {
  return (
    <CrudPage
      title="Menu"
      allow={["super_admin", "admin", "canteen_manager"]}
      endpoint="/canteen/menu"
      canEdit
      columns={[
        { key: "item_name", header: "Item" },
        { key: "category", header: "Category" },
        { key: "price", header: "Price", render: (r) => formatCurrency(r.price) },
        { key: "is_available", header: "Available", render: (r) => (Number(r.is_available) ? "Yes" : "No") },
      ]}
      fields={[
        { name: "item_name", label: "Item Name", required: true },
        { name: "category", label: "Category" },
        { name: "price", label: "Price", type: "number", required: true },
        {
          name: "is_available",
          label: "Availability",
          type: "select",
          options: [
            { id: 1, name: "Available" },
            { id: 0, name: "Unavailable" },
          ],
        },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
