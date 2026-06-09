"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check, KeyRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO = [
  ["Super Admin", "superadmin@school.com", "super123"],
  ["Admin", "admin@school.com", "admin123"],
  ["Teacher", "teacher@school.com", "teacher123"],
  ["Student", "student@school.com", "student123"],
  ["Parent", "parent@school.com", "parent123"],
  ["Accountant", "accountant@school.com", "accountant123"],
  ["Librarian", "librarian@school.com", "librarian123"],
  ["HR Manager", "hr@school.com", "hr123"],
  ["Warden", "warden@school.com", "warden123"],
  ["Transport", "transport@school.com", "transport123"],
  ["Health", "health@school.com", "health123"],
  ["Security", "security@school.com", "security123"],
  ["Canteen", "canteen@school.com", "canteen123"],
];

export default function TestCredentialsPage() {
  const [copied, setCopied] = useState("");

  async function copy(value, key) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1500);
    } catch { toast.error("Copy failed"); }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Button asChild variant="ghost" size="sm"><Link href="/"><ArrowLeft className="h-4 w-4" /> Home</Link></Button>
          <Button asChild size="sm"><Link href="/login"><LogIn className="h-4 w-4" /> Go to Login</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Test Credentials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use any of these demo accounts to explore the role-based dashboards. Click a value to copy it.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Demo Accounts</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {DEMO.map(([role, email, password]) => (
                <div key={email} className="rounded-lg border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{role}</span>
                    <Badge variant="secondary">demo</Badge>
                  </div>
                  <button onClick={() => copy(email, `${email}-e`)}
                    className="flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-sm hover:bg-accent">
                    <span className="truncate"><span className="text-muted-foreground">Email: </span>{email}</span>
                    {copied === `${email}-e` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => copy(password, `${email}-p`)}
                    className="mt-1.5 flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-sm hover:bg-accent">
                    <span className="font-mono"><span className="font-sans text-muted-foreground">Password: </span>{password}</span>
                    {copied === `${email}-p` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          These accounts are for demonstration only. Replace or disable them in production.
        </p>
      </main>
    </div>
  );
}
