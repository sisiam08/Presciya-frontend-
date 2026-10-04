import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


const authRoutes = ["/login", "/signup", "/forgot-password"];


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type SessionState = {
  authenticated: boolean;
  
  systemRole?: string;
  
  recoverable: boolean;
};


const resolveSession = async (request: NextRequest): Promise<SessionState> => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasAccessToken = Boolean(request.cookies.get("accessToken")?.value);
  const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);

  
  
  if (!hasAccessToken) {
    return { authenticated: false, recoverable: hasRefreshToken };
  }

  if (!API_BASE_URL) {
    
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

    
    return { authenticated: false, recoverable: false };
  } catch {
    
    return { authenticated: false, recoverable: false };
  }
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  
  const isLandingRoute = pathname === "/";
  const isSignedOutOnlyRoute = isAuthRoute || isLandingRoute;

  const { authenticated, systemRole, recoverable } = await resolveSession(request);
  const hasSession = authenticated || recoverable;

  
  
  const isUserRoute =
    (pathname.startsWith("/dashboard") && !isAdminRoute) ||
    pathname.startsWith("/institution") ||
    pathname.startsWith("/select-workspace");

  
  
  if ((isUserRoute || isAdminRoute) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  
  
  if (isAdminRoute && systemRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  
  if (isUserRoute && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  
  if (isSignedOutOnlyRoute && hasSession && systemRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  
  if (isSignedOutOnlyRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
