import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname, searchParams } = req.nextUrl;

  // ─── 1. Determine Local vs Real / Production Environment ─────────────────
  const isLocal =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    process.env.NODE_ENV === "development";

  // Maintenance is active on the real / deployed website by default, but disabled on local
  const isMaintenanceMode =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" ||
    (!isLocal && process.env.MAINTENANCE_MODE !== "false");

  // Admin secret bypass parameter or cookie
  const bypassParam = searchParams.get("bypass_maintenance");
  const bypassCookie = req.cookies.get("guidebloc_maintenance_bypass")?.value;
  const isBypassed =
    bypassParam === "guidebloc_preview_2026" ||
    bypassCookie === "guidebloc_preview_2026";

  // ─── 2. Handle Maintenance Mode on Real / Live Website ───────────────────
  if (isMaintenanceMode && !isBypassed) {
    // Always allow the maintenance page itself
    if (pathname === "/maintenance") {
      return NextResponse.next();
    }

    // Return 503 Service Unavailable for API endpoints during maintenance
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message: "GuideBloc platform is currently undergoing scheduled maintenance and Fuji testnet migration.",
        },
        { status: 503 }
      );
    }

    // Redirect all public and protected web pages to /maintenance
    const maintenanceUrl = new URL("/maintenance", req.url);
    const response = NextResponse.redirect(maintenanceUrl, 307);

    // If admin is activating bypass param, set cookie so subsequent navigation stays bypassed
    if (bypassParam === "guidebloc_preview_2026") {
      response.cookies.set("guidebloc_maintenance_bypass", "guidebloc_preview_2026", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: "lax",
      });
      return NextResponse.redirect(new URL(pathname, req.url));
    }

    return response;
  }

  // If on local (or bypassed) and user is accessing /maintenance, allow viewing it
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  // ─── 3. Role-Based Route Protection for Local / Active Platform ──────────
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Guide dashboard protection
    if (pathname.startsWith("/dashboard/guide")) {
      if (token.role === "TOURIST") {
        return NextResponse.redirect(new URL("/dashboard/tourist/bookings", req.url));
      }
      if (token.role !== "GUIDE" && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    // Tourist dashboard protection
    if (pathname.startsWith("/dashboard/tourist")) {
      if (token.role === "GUIDE") {
        return NextResponse.redirect(new URL("/dashboard/guide/overview", req.url));
      }
      if (token.role !== "TOURIST" && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    // Admin dashboard protection
    if (pathname.startsWith("/admin")) {
      if (token.role !== "ADMIN") {
        const fallback = token.role === "GUIDE" ? "/dashboard/guide/overview" : "/dashboard/tourist/bookings";
        return NextResponse.redirect(new URL(fallback, req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png
     * - assets folder
     * - static image/font extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
