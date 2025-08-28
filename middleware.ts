import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Allow API routes to handle their own authentication
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Only protect /dashboard and its subroutes
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // If user tries to access dashboard and has no token, redirect to login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If user is on auth page and has valid token, redirect to dashboard
  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // All other routes are public
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};