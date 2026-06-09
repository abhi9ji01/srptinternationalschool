"use client";
import { useParams } from "next/navigation";
import OrderDetailBuyer from "@/components/shop/OrderDetailBuyer";
export default function StudentOrderDetail() {
  const { orderId } = useParams();
  return <OrderDetailBuyer orderId={orderId} allow={["student"]} basePath="/student/shop" />;
}
