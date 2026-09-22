import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes only for unauthenticated users.
const authRoutes = ["/login", "/signup", "/forgot-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const systemRole = request.cookies.get("systemRole")?.value;

  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  // The marketing landing page is signed-out only too. It must be an EXACT
  // match — `startsWith("/")` would match every route.
  const isLandingRoute = pathname === "/";
  const isSignedOutOnlyRoute = isAuthRoute || isLandingRoute;
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

  // 4. Logged-in SUPER_ADMIN on a signed-out-only page (/, /login, /signup,
  //    /forgot-password) -> Redirect to their admin dashboard.
  if (isSignedOutOnlyRoute && token && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  // 5. Logged-in regular user on a signed-out-only page -> Redirect to /dashboard
  if (isSignedOutOnlyRoute && token) {
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
