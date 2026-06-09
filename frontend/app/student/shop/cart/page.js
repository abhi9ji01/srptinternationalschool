"use client";
import CartView from "@/components/shop/CartView";
export default function StudentCart() { return <CartView allow={["student"]} basePath="/student/shop" />; }
