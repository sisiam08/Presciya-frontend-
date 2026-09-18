// src/lib/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  withCredentials: true, // send cookies (accessToken/refreshToken) automatically
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401 and show toast on errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Refresh token is an httpOnly cookie; backend is /auth/refresh-token.
        const refreshRes = await api.post('/auth/refresh-token');
        const payload = refreshRes.data?.data || refreshRes.data;
        const newToken = payload?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (e) {
        // Refresh failed – force logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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
