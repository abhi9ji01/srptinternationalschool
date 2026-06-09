"use client";
import CartView from "@/components/shop/CartView";
export default function ParentCart() { return <CartView allow={["parent"]} basePath="/parent/shop" />; }
