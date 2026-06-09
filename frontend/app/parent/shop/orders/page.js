"use client";
import MyOrders from "@/components/shop/MyOrders";
export default function ParentOrders() { return <MyOrders allow={["parent"]} basePath="/parent/shop" />; }
