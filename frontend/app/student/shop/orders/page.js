"use client";
import MyOrders from "@/components/shop/MyOrders";
export default function StudentOrders() { return <MyOrders allow={["student"]} basePath="/student/shop" />; }
