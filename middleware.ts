import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Guard against common truncated mobile URLs and redirect to full routes
  // e.g., '/dashbc' or '/dashbo' → '/dashboard'
  // Respect trailingSlash=true in next.config.ts to avoid redirect loops
  // Only catch specific truncated paths (avoid catching real subroutes like /dashboard/expr...)
  const redirectMap: Record<string, string> = {
    "/dashbc": "/dashboard/",
    "/dashbo": "/dashboard/",
    "/marke": "/market/",
    "/rat": "/rates/",
    "/blo": "/blog/",
    "/p2": "/p2p/",
  };

  for (const [partial, full] of Object.entries(redirectMap)) {
    if (pathname === partial || pathname === partial + "/") {
      return NextResponse.redirect(new URL(full, request.url));
    }
  }

  // Allow API routes to handle their own authentication
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Only protect /dashboard and its subroutes
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // If user tries to access dashboard and has no token, redirect to login
  if (isDashboardRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    const attemptedPath = `${pathname}${request.nextUrl.search || ""}`;
    loginUrl.searchParams.set("redirect", attemptedPath);
    return NextResponse.redirect(loginUrl);
  }

  // If user is on auth page, do not auto-redirect to dashboard based on cookie alone.
  // Let the client validate the token and redirect. This avoids loops with stale cookies.
  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage) {
    return NextResponse.next();
  }

  // All other routes are public
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};