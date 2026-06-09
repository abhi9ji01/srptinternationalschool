"use client";
import { useParams } from "next/navigation";
import ProductDetail from "@/components/shop/ProductDetail";
export default function ParentProductPage() {
  const { productId } = useParams();
  return <ProductDetail productId={productId} allow={["parent"]} basePath="/parent/shop" />;
}
