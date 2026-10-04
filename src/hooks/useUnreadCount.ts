"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";


const EVENT = "unread-count-changed";

let cachedCount = 0;

export const setUnreadCount = (value: number): void => {
  cachedCount = value;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  }
};


export const refreshUnreadCount = async (): Promise<void> => {
  try {
    const res = await apiClient.get<any>(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
    const count = Number(res.data?.count ?? res.data?.data?.count ?? 0);
    setUnreadCount(count);
  } catch {
    
  }
};

export function useUnreadCount(): number {
  const [count, setCount] = useState(cachedCount);

  useEffect(() => {
    const onChange = (e: Event) =>
      setCount(Number((e as CustomEvent).detail ?? 0));
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  return count;
}
