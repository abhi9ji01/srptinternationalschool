'use client';
import "./globals.css";
import { useEffect } from "react";

import Providers from "@/components/providers";

export const metadata = {
  title: "School Management System",
  description: "Production-ready multi-branch school management system",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
   useEffect(() => {
    if (typeof window !== "undefined") {
      import("eruda").then((eruda) => {
        eruda.default.init();
      });
    }
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
