"use client";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { SocketProvider } from "@/contexts/SocketContext";
import TopProgressBar from "@/components/shared/TopProgressBar";
import PWARegister from "@/components/PWARegister";

export default function Providers({ children }) {
  // Mobile/remote debug console (eruda). Client-only; loaded lazily.
  useEffect(() => {
    import("eruda").then((eruda) => eruda.default.init()).catch(() => {});
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SchoolProvider>
          <SocketProvider>
            <TopProgressBar />
            {children}
            <Toaster />
            <PWARegister />
          </SocketProvider>
        </SchoolProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
