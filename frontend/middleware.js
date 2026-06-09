import { NextResponse } from "next/server";
import { ROUTE_ACCESS } from "@/lib/constants";

const PUBLIC = [
  "/",
  "/test-credentials",
  "/login",
  "/login/forgot-password",
  "/login/reset-password",
  "/unauthorized",
  "/alumni/register",
  "/alumni/directory",
];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    PUBLIC.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("sms_token")?.value;
  const role = req.cookies.get("sms_role")?.value;

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Match the most specific (longest) prefix so e.g. "/admin/shop" can grant
  // accountant access even though "/admin" is admin-only.
  const prefix = Object.keys(ROUTE_ACCESS)
    .filter((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix && role && !ROUTE_ACCESS[prefix].includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
