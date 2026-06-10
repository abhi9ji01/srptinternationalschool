import "./globals.css";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
