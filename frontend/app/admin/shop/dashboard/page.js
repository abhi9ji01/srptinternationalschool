"use client";
import ShopDashboard from "@/components/shop/ShopDashboard";

export default function AdminShopDashboard() {
  return <ShopDashboard allow={["super_admin", "admin"]} basePath="/admin/shop" />;
}
