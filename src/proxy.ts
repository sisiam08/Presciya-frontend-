import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes only for unauthenticated users
const authRoutes = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const systemRole = request.cookies.get("systemRole")?.value;

  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  // Workspace selection is part of the authenticated flow.
  const isWorkspaceRoute = pathname.startsWith("/select-workspace");

  // User-only routes: /dashboard (excluding /dashboard/admin), /institution and
  // the workspace selector.
  const isUserRoute =
    (pathname.startsWith("/dashboard") && !isAdminRoute) ||
    pathname.startsWith("/institution") ||
    isWorkspaceRoute;

  // 1. Unauthenticated user trying to access protected routes -> Redirect to /login
  if ((isUserRoute || isAdminRoute) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Standard user (non-SUPER_ADMIN) trying to access Admin route -> Forbidden, Redirect to /dashboard
  if (isAdminRoute && systemRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Admin user (SUPER_ADMIN) trying to access User route -> Forbidden, Redirect to /dashboard/admin
  if (isUserRoute && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  // 4. Logged-in SUPER_ADMIN trying to access auth pages (login/signup) -> Redirect to /dashboard/admin
  if (isAuthRoute && token && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  // 5. Logged-in regular user trying to access auth pages (login/signup) -> Redirect to /dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
