
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { isAuthEndpoint, refreshSession } from '@/lib/auth-session';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  withCredentials: true, 
});





api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;

    
    
    
    
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
