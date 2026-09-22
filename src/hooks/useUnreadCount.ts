"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

/**
 * Shared unread-notification count.
 *
 * The sidebar badge and the notifications page must agree at all times, so the
 * value lives in ONE place instead of each component fetching its own copy.
 * Uses the same lightweight module-store + window-event pattern the rest of the
 * app already uses for cross-component state (see useActiveChamber) — no second
 * state library.
 */
const EVENT = "unread-count-changed";

let cachedCount = 0;

export const setUnreadCount = (value: number): void => {
  cachedCount = value;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  }
};

/** Re-read the authoritative count from the server and broadcast it. */
export const refreshUnreadCount = async (): Promise<void> => {
  try {
    const res = await apiClient.get<any>(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
    const count = Number(res.data?.count ?? res.data?.data?.count ?? 0);
    setUnreadCount(count);
  } catch {
    // Keep the last known value rather than showing a misleading zero.
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
