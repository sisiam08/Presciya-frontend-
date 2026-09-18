"use client";

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Extended Axios config type
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private failedQueue: {
    onSuccess: (token: string) => void;
    onFailed: (err: Error) => void;
  }[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true, // send cookies (accessToken/refreshToken) automatically
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") || localStorage.getItem("auth_token")
            : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const activeWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeWorkspaceId")
            : null;
        if (activeWorkspaceId) {
          config.headers["x-workspace-id"] = activeWorkspaceId;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        if (error.response?.status === 401 && originalRequest) {
          if (this.refreshing) {
            return new Promise((onSuccess, onFailed) => {
              this.failedQueue.push({ onSuccess, onFailed });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            });
          }

          this.refreshing = true;

          try {
            // The refresh token is an httpOnly cookie; the backend endpoint is
            // /auth/refresh-token and responds with { data: { accessToken } }.
            const response = await this.client.post("/auth/refresh-token");
            const payload = response.data?.data || response.data;
            const token: string | undefined = payload?.accessToken;

            if (!token) throw new Error("Refresh did not return an access token");

            localStorage.setItem("accessToken", token);
            localStorage.removeItem("auth_token");

            this.processQueue(null, token);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            return this.client(originalRequest);
          } catch (err) {
            this.processQueue(err as Error, null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
            return Promise.reject(err);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private processQueue(error: Error | null, token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.onFailed(error);
      } else if (token) {
        prom.onSuccess(token);
      }
    });
    this.failedQueue = [];
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
}

export const apiClient = new ApiClient();
export default apiClient.getInstance();
