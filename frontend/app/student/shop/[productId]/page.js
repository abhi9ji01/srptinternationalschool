"use client";
import { useParams } from "next/navigation";
import ProductDetail from "@/components/shop/ProductDetail";
export default function StudentProductPage() {
  const { productId } = useParams();
  return <ProductDetail productId={productId} allow={["student"]} basePath="/student/shop" />;
}
