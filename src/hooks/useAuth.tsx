"use client";
// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  clearSessionHint,
  hasSessionHint,
  markSessionPresent,
} from '@/lib/auth-session';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  systemRole?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    redirect?: string,
  ) => Promise<{ requiresWorkspaceSelection: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Cookie lifetime suffix for the access-token cookie.
 *
 * Derived from the token's OWN `exp` claim instead of a hardcoded number: the
 * cookie used to be pinned at "12 hours", which matched neither the access-token
 * lifetime nor the refresh-token architecture (the session is kept alive by the
 * rotating refresh cookie, not by this one). Deriving it means the client can
 * never grant — or claim — a lifetime different from what the server issued.
 */
const accessTokenCookieMaxAge = (token: unknown): string => {
  try {
    const encoded = String(token).split(".")[1];
    if (!encoded) return "";
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(typeof atob === "function" ? atob(base64) : "");
    if (typeof claims?.exp !== "number") return "";
    const seconds = Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
    return `; max-age=${seconds}`;
  } catch {
    return "";
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      // Only ask the server when a session might exist. The marker is not a
      // credential — the API is still the source of truth.
      if (!hasSessionHint()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        // Backend wraps the response as { success, data: { user, profile, workspaces } }.
        const payload = res.data?.data || res.data;
        const userData = payload?.user ?? payload;
        // The role travels in the access token and in this server response —
        // no separate role cookie is written or trusted.
        setUser(userData);
        markSessionPresent();
      } catch {
        // No usable session. If the access token was merely expired the
        // interceptor already refreshed it; reaching here means the session is
        // gone (and the interceptor has ended it), so drop the local state.
        clearSessionHint();
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string, redirect?: string) => {
    const res = await api.post('/auth/login', { email, password });
    // Backend sends: { success, data: { user: {...}, accessToken: "..." } }
    // refreshToken is set as a cookie by the backend (httpOnly)
    const payload = res.data?.data || res.data;
    const accessToken = payload?.accessToken;
    const loggedUser = payload?.user;
    // No token is kept in localStorage — the backend already set the session
    // cookies on this response; only a non-secret marker is recorded.
    if (accessToken) {
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax${accessTokenCookieMaxAge(accessToken)}`;
    }
    markSessionPresent();
    setUser(loggedUser);

    // Deep-link redirect (e.g. returning to an invitation after login). Persist
    // a workspace when there is exactly one so workspace-scoped pages resolve.
    if (redirect) {
      const wsList = loggedUser?.workspaces || [];
      if (wsList.length >= 1 && wsList[0]?.id) {
        localStorage.setItem('activeWorkspaceId', wsList[0].id);
      }
      router.push(redirect);
      return { requiresWorkspaceSelection: false };
    }

    // Invited user whose only memberships are pending: send them to their
    // pending invitations so they can accept (they have no active workspace).
    if (
      payload?.requiresInvitationAcceptance ||
      loggedUser?.requiresInvitationAcceptance
    ) {
      router.push('/invitations');
      return { requiresWorkspaceSelection: false };
    }

    // Resolve the active workspace here instead of sending the user to a
    // separate /select-workspace page (that step is redundant — the dashboard
    // already has a workspace switcher). Restore the last used workspace when
    // the user is still a member of it, otherwise fall back to the first.
    const wsList = loggedUser?.workspaces || [];
    if (wsList.length >= 1) {
      const saved =
        typeof window !== 'undefined'
          ? localStorage.getItem('activeWorkspaceId')
          : null;
      const target = wsList.find((w: any) => w.id === saved) || wsList[0];

      if (target?.id) {
        // Scope the session to the workspace through the same endpoint the
        // sidebar switcher uses. Best-effort: even if this fails we still land
        // on the dashboard, and the backend keeps enforcing workspace access.
        try {
          const switchRes = await api.post('/auth/switch-workspace', {
            workspaceId: target.id,
          });
          const switchPayload = switchRes.data?.data || switchRes.data;
          const scopedToken = switchPayload?.accessToken;
          if (scopedToken) {
            document.cookie = `accessToken=${scopedToken}; path=/; SameSite=Lax${accessTokenCookieMaxAge(scopedToken)}`;
          }
          markSessionPresent();
        } catch {
          // Non-fatal — workspace authorization remains enforced server-side.
        }
        localStorage.setItem('activeWorkspaceId', target.id);
      }
    }

    // Route based on system role
    if (loggedUser?.systemRole === 'SUPER_ADMIN') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard');
    }
    return { requiresWorkspaceSelection: false };
  };

  const logout = async () => {
    clearSessionHint();
    document.cookie = 'accessToken=; path=/; max-age=0';
    setUser(null);
    try {
      // Invalidate the server-side session and clear the httpOnly refresh
      // cookie BEFORE navigating — otherwise the proxy still sees a session
      // cookie and bounces /login straight back to the dashboard.
      await api.post('/auth/logout');
    } catch {
      // Best effort — local state is already cleared, so the user is signed
      // out of this browser regardless.
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
