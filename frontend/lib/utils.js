import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(date, opts = {}) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", ...opts });
}

export function formatDateTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function gradeFromPercentage(percentage, gradeConfig = []) {
  const p = Number(percentage || 0);
  const match = gradeConfig.find((g) => p >= Number(g.min_percentage) && p <= Number(g.max_percentage));
  return match ? match.grade_name : "—";
}

export function percentage(obtained, total) {
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.round((Number(obtained || 0) / t) * 10000) / 100;
}

// Generate human-friendly sequential-ish reference numbers.
export function genReceiptNumber() {
  return "RCPT-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000);
}

export function genCertificateNumber(type) {
  return `${(type || "CERT").toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export function genPassNumber() {
  return "VP-" + new Date().getFullYear() + "-" + Date.now().toString().slice(-6);
}

export function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function statusColor(status) {
  const map = {
    paid: "bg-green-100 text-green-800",
    present: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    partial: "bg-yellow-100 text-yellow-800",
    late: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    absent: "bg-red-100 text-red-800",
    rejected: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
    excused: "bg-blue-100 text-blue-800",
    issued: "bg-blue-100 text-blue-800",
    returned: "bg-green-100 text-green-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
