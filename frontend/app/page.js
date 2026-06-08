"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading, homeFor } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (user) router.replace(homeFor(user.role));
    else router.replace("/login");
  }, [user, loading, router, homeFor]);
  return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
}
