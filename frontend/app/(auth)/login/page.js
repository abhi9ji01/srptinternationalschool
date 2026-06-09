"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
function LoginPage() {
  const { login, homeFor } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password, needsOtp ? { otp } : {});
      if (res.twoFactor) {
        setNeedsOtp(true);
        toast.info(res.message || "Enter the OTP sent to your email");
        return;
      }
      toast.success("Welcome back!");
      router.replace(params.get("callbackUrl") || homeFor(res.user.role));
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center bg-primary text-primary-foreground p-12">
        <GraduationCap className="h-16 w-16 mb-6" />
        <h1 className="text-4xl font-bold mb-3">SRPT International School</h1>
        <p className="text-lg opacity-90 max-w-md">
          Complete School Management System — academics, attendance, exams, fees, transport, hostel, HR and more.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 lg:hidden mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="font-bold text-lg">School MS</span>
              </div>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@school.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                {needsOtp && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP (sent to email)</Label>
                    <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <div className="text-center">
                  <Link href="/login/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-medium">Need a demo account?</p>
                <p className="text-xs text-muted-foreground">View test credentials for every role.</p>
              </div>
              <Button asChild variant="outline" size="sm"><Link href="/test-credentials">Test Credentials</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}
