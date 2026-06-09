// Shared shop helpers (status colors + labels).

export const SHOP_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  ready: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  partially_delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function shopStatusColor(s) {
  return SHOP_STATUS_COLORS[s] || "bg-gray-100 text-gray-800";
}

export function stockStatus(p) {
  if (p.is_unlimited_stock) return { label: "In Stock", color: "text-green-600" };
  if (Number(p.stock_quantity) <= 0) return { label: "Out of Stock", color: "text-red-600" };
  if (Number(p.stock_quantity) < 5) return { label: `Limited (${p.stock_quantity})`, color: "text-amber-600" };
  return { label: "In Stock", color: "text-green-600" };
}

export const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
