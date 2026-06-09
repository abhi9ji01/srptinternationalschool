"use client";
import FeeStructureManager from "@/components/fees/FeeStructureManager";
import { useAuth } from "@/lib/auth-context";

export default function AccountantFeeStructure() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  return <FeeStructureManager isAdmin={isAdmin} />;
}
