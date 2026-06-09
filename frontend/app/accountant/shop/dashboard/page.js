"use client";
import ShopDashboard from "@/components/shop/ShopDashboard";

export default function AccountantShopDashboard() {
  return <ShopDashboard allow={["accountant", "admin", "super_admin"]} basePath="/admin/shop" />;
}
