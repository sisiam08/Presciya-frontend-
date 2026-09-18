"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { AxiosError } from "axios";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      method: "get" | "post" | "put" | "patch" | "delete",
      url: string,
      payload?: any,
    ) => {
      try {
        setLoading(true);
        setError(null);

        let response;
        switch (method) {
          case "get":
            response = await apiClient.get<T>(url);
            break;
          case "post":
            response = await apiClient.post<T>(url, payload);
            break;
          case "put":
            response = await apiClient.put<T>(url, payload);
            break;
          case "patch":
            response = await apiClient.patch<T>(url, payload);
            break;
          case "delete":
            response = await apiClient.delete<T>(url);
            break;
        }

        setData(response.data as T);
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const message =
          ((err as AxiosError)?.response?.data as any)?.message ||
          (err as Error)?.message ||
          "An error occurred";
        setError(message as string);
        options.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const get = useCallback((url: string) => execute("get", url), [execute]);
  const post = useCallback(
    (url: string, payload: any) => execute("post", url, payload),
    [execute],
  );
  const put = useCallback(
    (url: string, payload: any) => execute("put", url, payload),
    [execute],
  );
  const patch = useCallback(
    (url: string, payload: any) => execute("patch", url, payload),
    [execute],
  );
  const remove = useCallback(
    (url: string) => execute("delete", url),
    [execute],
  );

  return {
    data,
    loading,
    error,
    execute,
    get,
    post,
    put,
    patch,
    delete: remove,
  };
}

// Query hook for data fetching
export function useQuery<T = any>(
  url: string | null,
  options: UseApiOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!url) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<T>(url);
      setData(response.data as T);
      options.onSuccess?.(response.data);
    } catch (err) {
      const message =
        ((err as AxiosError)?.response?.data as any)?.message ||
        (err as Error)?.message ||
        "An error occurred";
      setError(message as string);
      options.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  // Auto-fetch when URL changes
  useEffect(() => {
    refetch();
  }, [url]);

  return { data, loading, error, refetch };
}

// Mutation hook for POST/PUT/PATCH/DELETE
export function useMutation<T = any>(
  method: "post" | "put" | "patch" | "delete",
  options: UseApiOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (url: string, payload?: any) => {
      try {
        setLoading(true);
        setError(null);

        let response;
        switch (method) {
          case "post":
            response = await apiClient.post<T>(url, payload);
            break;
          case "put":
            response = await apiClient.put<T>(url, payload);
            break;
          case "patch":
            response = await apiClient.patch<T>(url, payload);
            break;
          case "delete":
            response = await apiClient.delete<T>(url);
            break;
        }

        setData(response.data as T);
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const message =
          ((err as AxiosError)?.response?.data as any)?.message ||
          (err as Error)?.message ||
          "An error occurred";
        setError(message as string);
        options.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [method, options],
  );

  return { data, loading, error, mutate };
}
