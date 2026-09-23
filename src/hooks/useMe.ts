"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

/** The part of the `/auth/me` payload these surfaces consume. */
export interface MePayload {
  user?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  workspaces?: unknown[];
}

/**
 * Shared, single-flight `/auth/me` reader.
 *
 * Several independent surfaces (the verification notice, the chambers page, the
 * profile page) need the same payload. With per-component fetching, a single
 * dashboard load issued two or three identical `/auth/me` requests. This keeps
 * it to ONE per app load, regardless of how many consumers subscribe.
 *
 * The cache is process-wide but short-lived: the workspace switcher performs a
 * full page reload (`window.location.reload()`), so it can never outlive the
 * session or workspace it was fetched for.
 */
let cached: MePayload | null = null;
let loaded = false;
let inFlight: Promise<MePayload | null> | null = null;
const subscribers = new Set<(value: MePayload | null) => void>();

const notify = () => subscribers.forEach((fn) => fn(cached));

export const fetchMe = (): Promise<MePayload | null> => {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await apiClient.get<{ data: MePayload }>(API_ROUTES.AUTH.ME);
      cached = res.data?.data || (res.data as unknown as MePayload) || null;
    } catch {
      cached = null;
    } finally {
      loaded = true;
      inFlight = null;
      notify();
    }
    return cached;
  })();

  return inFlight;
};

/** Drops the cache and refetches (e.g. after a profile mutation). */
export const refreshMe = (): Promise<MePayload | null> => {
  loaded = false;
  return fetchMe();
};

export function useMe() {
  const [me, setMe] = useState<MePayload | null>(cached);
  const [loading, setLoading] = useState(!loaded);

  useEffect(() => {
    const sync = (value: MePayload | null) => {
      setMe(value);
      setLoading(false);
    };
    subscribers.add(sync);
    // State is already seeded from the cache by the useState initialiser, so
    // there is no synchronous setState here — only the first fetch.
    if (!loaded) void fetchMe();
    return () => {
      subscribers.delete(sync);
    };
  }, []);

  return { me, loading, profile: me?.profile ?? null, user: me?.user ?? null };
}
