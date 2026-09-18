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
  login: (email: string, password: string) => Promise<void>;
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
        // Backend wraps response in { success, data } envelope
        const userData = res.data?.data || res.data;
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

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    // Backend sends: { success, data: { user: {...}, accessToken: "..." } }
    // refreshToken is set as a cookie by the backend (httpOnly)
    const payload = res.data?.data || res.data;
    const accessToken = payload?.accessToken;
    const loggedUser = payload?.user;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    setUser(loggedUser);
    // Persist role as a cookie for Next.js middleware route guards
    const maxAge = 60 * 60 * 12; // 12 hours
    if (accessToken) {
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    document.cookie = `systemRole=${loggedUser?.systemRole || 'USER'}; path=/; max-age=${maxAge}; SameSite=Lax`;
    // Route based on system role
    if (loggedUser?.systemRole === 'SUPER_ADMIN') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard');
    }
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
