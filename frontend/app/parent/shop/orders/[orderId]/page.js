"use client";
import { useParams } from "next/navigation";
import OrderDetailBuyer from "@/components/shop/OrderDetailBuyer";
export default function ParentOrderDetail() {
  const { orderId } = useParams();
  return <OrderDetailBuyer orderId={orderId} allow={["parent"]} basePath="/parent/shop" />;
}
