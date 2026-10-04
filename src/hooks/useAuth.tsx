"use client";

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
      
      
      if (!hasSessionHint()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        
        const payload = res.data?.data || res.data;
        const userData = payload?.user ?? payload;
        
        
        setUser(userData);
        markSessionPresent();
      } catch {
        
        
        
        clearSessionHint();
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string, redirect?: string) => {
    const res = await api.post('/auth/login', { email, password });
    
    
    const payload = res.data?.data || res.data;
    const accessToken = payload?.accessToken;
    const loggedUser = payload?.user;
    
    
    if (accessToken) {
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax${accessTokenCookieMaxAge(accessToken)}`;
    }
    markSessionPresent();
    setUser(loggedUser);

    
    
    if (redirect) {
      const wsList = loggedUser?.workspaces || [];
      if (wsList.length >= 1 && wsList[0]?.id) {
        localStorage.setItem('activeWorkspaceId', wsList[0].id);
      }
      router.push(redirect);
      return { requiresWorkspaceSelection: false };
    }

    
    
    if (
      payload?.requiresInvitationAcceptance ||
      loggedUser?.requiresInvitationAcceptance
    ) {
      router.push('/invitations');
      return { requiresWorkspaceSelection: false };
    }

    
    
    
    
    const wsList = loggedUser?.workspaces || [];
    if (wsList.length >= 1) {
      const saved =
        typeof window !== 'undefined'
          ? localStorage.getItem('activeWorkspaceId')
          : null;
      const target = wsList.find((w: any) => w.id === saved) || wsList[0];

      if (target?.id) {
        
        
        
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
          
        }
        localStorage.setItem('activeWorkspaceId', target.id);
      }
    }

    
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
      
      
      
      await api.post('/auth/logout');
    } catch {
      
      
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
