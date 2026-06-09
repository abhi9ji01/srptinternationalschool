"use client";
import { useParams } from "next/navigation";
import ProductForm from "@/components/shop/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();
  return <ProductForm productId={id} />;
}
