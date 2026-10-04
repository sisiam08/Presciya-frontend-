"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";


export interface MePayload {
  user?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  workspaces?: unknown[];
}


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
    
    
    if (!loaded) void fetchMe();
    return () => {
      subscribers.delete(sync);
    };
  }, []);

  return { me, loading, profile: me?.profile ?? null, user: me?.user ?? null };
}
