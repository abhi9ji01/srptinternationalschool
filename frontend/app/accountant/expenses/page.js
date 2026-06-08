"use client";
import CrudPage from "@/components/shared/CrudPage";
import { formatCurrency, formatDate } from "@/lib/utils";

const ALLOW = ["super_admin", "admin", "accountant"];

export default function ExpensesPage() {
  return (
    <CrudPage
      title="Expenses"
      allow={ALLOW}
      endpoint="/expenses"
      canEdit
      columns={[
        { key: "title", header: "Title" },
        { key: "category", header: "Category" },
        { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
        { key: "expense_date", header: "Date", render: (r) => formatDate(r.expense_date) },
        { key: "paid_to", header: "Paid To" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "category", label: "Category" },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "expense_date", label: "Expense Date", type: "date" },
        { name: "paid_to", label: "Paid To" },
        { name: "payment_mode", label: "Payment Mode", type: "select", options: ["cash", "cheque", "online", "upi"] },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
