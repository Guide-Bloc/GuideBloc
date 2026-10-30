import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route protection
    if (path.startsWith("/dashboard/guide")) {
      if (token?.role === "TOURIST") {
        return NextResponse.redirect(new URL("/dashboard/tourist/bookings", req.url));
      }
      if (token?.role !== "GUIDE" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    if (path.startsWith("/dashboard/tourist")) {
      if (token?.role === "GUIDE") {
        return NextResponse.redirect(new URL("/dashboard/guide/overview", req.url));
      }
      if (token?.role !== "TOURIST" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        const fallback = token?.role === "GUIDE" ? "/dashboard/guide/overview" : "/dashboard/tourist/bookings";
        return NextResponse.redirect(new URL(token ? fallback : "/auth/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
