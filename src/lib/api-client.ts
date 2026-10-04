"use client";

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { isAuthEndpoint, refreshSession } from "@/lib/auth-session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";


interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true, 
      headers: {
        "Content-Type": "application/json",
      },
    });

    
    this.client.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        
        
        
        const activeWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeWorkspaceId")
            : null;
        if (activeWorkspaceId) {
          config.headers["x-workspace-id"] = activeWorkspaceId;
        }
        
        
        
        const activeChamberId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeChamberId")
            : null;
        if (activeChamberId) {
          config.headers["x-chamber-id"] = activeChamberId;
        }
        
        
        
        const workspaceScope =
          typeof window !== "undefined"
            ? localStorage.getItem("workspaceScope")
            : null;
        if (workspaceScope === "all" && !activeChamberId) {
          config.headers["x-workspace-scope"] = "all";
        }
        
        
        if (
          typeof FormData !== "undefined" &&
          config.data instanceof FormData
        ) {
          
          
          config.headers.delete("Content-Type");
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        
        
        
        
        
        
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthEndpoint(originalRequest.url)
        ) {
          originalRequest._retry = true;
          try {
            await refreshSession();
            return this.client(originalRequest);
          } catch (refreshError) {
            
            
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  public getInstance() {
    return this.client;
  }

  public async get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  public async post<T>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  public async put<T>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  public async patch<T>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  public async delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }

  
  public async upload<T>(url: string, formData: FormData, config = {}) {
    return this.client.post<T>(url, formData, {
      ...config,
      timeout: 60000,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient.getInstance();
