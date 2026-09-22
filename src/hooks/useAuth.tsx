"use client";
// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        // Backend wraps the response as { success, data: { user, profile, workspaces } }.
        const payload = res.data?.data || res.data;
        const userData = payload?.user ?? payload;
        setUser(userData);
        if (userData?.systemRole) {
          const maxAge = 60 * 60 * 12;
          document.cookie = `systemRole=${userData.systemRole}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
      } catch {
        // /auth/me failed — token might be expired or invalid
        // Don't clear the token here; the api.ts interceptor will attempt a refresh
        // Only clear if there truly is no valid session after retry
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
    const maxAge = 60 * 60 * 12; // 12 hours
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    setUser(loggedUser);
    // Persist role as a cookie for route guards
    document.cookie = `systemRole=${loggedUser?.systemRole || 'USER'}; path=/; max-age=${maxAge}; SameSite=Lax`;

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
            localStorage.setItem('accessToken', scopedToken);
            document.cookie = `accessToken=${scopedToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
          }
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

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Clear auth cookies
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'systemRole=; path=/; max-age=0';
    setUser(null);
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
