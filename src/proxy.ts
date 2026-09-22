import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes only for unauthenticated users.
const authRoutes = ["/login", "/signup", "/forgot-password"];

// Public base URL of the API (safe to expose — it is only an address).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type SessionState = {
  authenticated: boolean;
  /** Present only when the backend validated the session. */
  systemRole?: string;
  /** An expired-but-authentic access token: the client can refresh. */
  recoverable: boolean;
};

/**
 * Resolve the session against the BACKEND, never from cookie existence or any
 * client state. The frontend deliberately holds no JWT secret: it forwards the
 * cookies to `/auth/me`, which validates the token and returns the
 * authoritative (database-derived) role.
 *
 *  200                          -> authenticated, role from the response
 *  401 TOKEN_EXPIRED            -> authentic but expired: recoverable (refresh)
 *  401 (invalid token)          -> not authentic: fail closed
 *  401 Unauthorized (no token)  -> recoverable only if a refresh cookie exists
 *  anything else / unreachable  -> fail closed
 */
const resolveSession = async (request: NextRequest): Promise<SessionState> => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasAccessToken = Boolean(request.cookies.get("accessToken")?.value);
  const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);

  // No access token at all: the short-lived cookie simply expired — a session
  // can still be recovered from the refresh cookie (never trust it as proof).
  if (!hasAccessToken) {
    return { authenticated: false, recoverable: hasRefreshToken };
  }

  if (!API_BASE_URL) {
    // Cannot validate without the API — fail closed.
    return { authenticated: false, recoverable: false };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (res.ok) {
      const body = await res.json().catch(() => null);
      const payload = body?.data ?? body;
      const systemRole = payload?.user?.systemRole ?? payload?.systemRole;
      return { authenticated: true, systemRole, recoverable: false };
    }

    const body = await res.json().catch(() => null);
    const code = body?.code ?? body?.error?.code;
    if (res.status === 401 && code === "TOKEN_EXPIRED") {
      return { authenticated: false, recoverable: hasRefreshToken };
    }

    // Invalid/forged token (or any other error): fail closed.
    return { authenticated: false, recoverable: false };
  } catch {
    // API unreachable — fail closed rather than admitting an unverified route.
    return { authenticated: false, recoverable: false };
  }
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  // The marketing landing page is signed-out only too. It must be an EXACT
  // match — `startsWith("/")` would match every route.
  const isLandingRoute = pathname === "/";
  const isSignedOutOnlyRoute = isAuthRoute || isLandingRoute;

  const { authenticated, systemRole, recoverable } = await resolveSession(request);
  const hasSession = authenticated || recoverable;

  // User-only routes: /dashboard (excluding /dashboard/admin), /institution and
  // the workspace selector.
  const isUserRoute =
    (pathname.startsWith("/dashboard") && !isAdminRoute) ||
    pathname.startsWith("/institution") ||
    pathname.startsWith("/select-workspace");

  // 1. No usable session on a protected route -> login, preserving the
  //    intended destination so the user returns there after signing in.
  if ((isUserRoute || isAdminRoute) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Non-SUPER_ADMIN on an Admin route -> forbidden. With a recoverable
  //    session the role is unknown, so admin routes fail closed.
  if (isAdminRoute && systemRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. SUPER_ADMIN on a user route -> their own dashboard.
  if (isUserRoute && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  // 4. Logged-in SUPER_ADMIN on a signed-out-only page -> admin dashboard.
  if (isSignedOutOnlyRoute && hasSession && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  // 5. Logged-in regular user on a signed-out-only page -> dashboard.
  if (isSignedOutOnlyRoute && hasSession) {
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
