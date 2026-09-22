"use client";

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { isAuthEndpoint, refreshSession } from "@/lib/auth-session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Extended Axios config type
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  /** Set once a request has been retried after a token refresh. */
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true, // send the session cookies automatically
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // The backend authenticates from the session cookies only
        // (`req.cookies.accessToken`), so no token is attached and none is kept
        // in localStorage/sessionStorage.
        const activeWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeWorkspaceId")
            : null;
        if (activeWorkspaceId) {
          config.headers["x-workspace-id"] = activeWorkspaceId;
        }
        // The chamber the user is currently working in. The backend validates
        // it against the workspace, so it can never reach another workspace's
        // chamber data. Absent => the personal (chamber-less) scope.
        const activeChamberId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeChamberId")
            : null;
        if (activeChamberId) {
          config.headers["x-chamber-id"] = activeChamberId;
        }
        // Data scope. Absent => "current" (the safe default); the backend only
        // widens to all authorized workspaces on an explicit "all", and only
        // from the personal context — a chamber always scopes to that chamber.
        const workspaceScope =
          typeof window !== "undefined"
            ? localStorage.getItem("workspaceScope")
            : null;
        if (workspaceScope === "all" && !activeChamberId) {
          config.headers["x-workspace-scope"] = "all";
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

        // Expired access token but a usable refresh token -> refresh and retry.
        // `refreshSession` is single-flight, so simultaneous 401s await the SAME
        // rotation (a second concurrent rotation would revoke the session).
        // Auth endpoints are excluded and _retry allows a single attempt per
        // request, so neither a wrong password nor a still-failing request can
        // start a refresh loop.
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
            // refreshSession has already ended the session and redirected once;
            // the queued/in-flight requests simply fail.
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
}

export const apiClient = new ApiClient();
export default apiClient.getInstance();
