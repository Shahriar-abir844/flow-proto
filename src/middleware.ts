import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const homeForRole: Record<string, string> = {
  AUTHORITY: "/authority",
  VENDOR_MANAGER: "/admin",
  VENDOR: "/vendor",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const home = homeForRole[user.role] ?? "/login";

  if (pathname.startsWith("/authority") && user.role !== "AUTHORITY") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname.startsWith("/admin") && user.role !== "VENDOR_MANAGER") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname.startsWith("/vendor") && user.role !== "VENDOR") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/authority/:path*", "/admin/:path*", "/vendor/:path*"],
};
