"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { SocketProvider } from "@/contexts/SocketContext";
import TopProgressBar from "@/components/shared/TopProgressBar";
import PWARegister from "@/components/PWARegister";

export default function Providers({ children }) {
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
