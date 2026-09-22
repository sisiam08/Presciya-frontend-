// src/lib/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { isAuthEndpoint, refreshSession } from '@/lib/auth-session';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  withCredentials: true, // send the session cookies automatically
});

// The backend authenticates exclusively from the session cookies
// (`req.cookies.accessToken`), so no Authorization header is attached and no
// token is ever written to localStorage/sessionStorage.

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;

    // Expired access token but a usable refresh token -> refresh once (shared
    // single-flight request) and retry the original call. Auth endpoints are
    // excluded so a wrong password never starts a refresh cycle, and _retry
    // guarantees at most one refresh attempt per request (no refresh loop).
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return api(originalRequest);
      } catch {
        // refreshSession has already ended the session and redirected.
        return Promise.reject(error);
      }
    }

    toast({
      title: 'Error',
      description: error.response?.data?.message || error.message,
      variant: 'destructive',
    });
    return Promise.reject(error);
  }
);

export default api;
