"use client";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function Unauthorized() {
  const { user, homeFor } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <ShieldX className="h-20 w-20 text-destructive mb-4" />
      <h1 className="text-3xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground mt-2 max-w-md">You don&apos;t have permission to view this page.</p>
      <Button asChild className="mt-6">
        <Link href={user ? homeFor(user.role) : "/login"}>Go to my dashboard</Link>
      </Button>
    </div>
  );
}
