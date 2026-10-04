"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

export interface FeatureEntitlement {
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface Entitlements {
  plan: {
    id: string;
    name: string;
    dailyPrescriptionLimit: number;
    price: number;
  } | null;
  subscription: { expiryDate: string; isActive: boolean } | null;
  features: Record<string, FeatureEntitlement>;
}


let cached: Entitlements | null = null;
let loaded = false;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

const notify = () => subscribers.forEach((fn) => fn());

const fetchEntitlements = (): Promise<void> => {
  
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await apiClient.get<{ data: Entitlements }>(
        API_ROUTES.SUBSCRIPTION.ENTITLEMENTS,
      );
      cached = res.data?.data || (res.data as unknown as Entitlements) || null;
    } catch {
      cached = null;
    } finally {
      loaded = true;
      inFlight = null;
      notify();
    }
  })();

  return inFlight;
};


export const refreshEntitlements = (): Promise<void> => {
  loaded = false;
  return fetchEntitlements();
};


export function useEntitlements() {
  const [state, setState] = useState<{
    entitlements: Entitlements | null;
    loading: boolean;
  }>(() => ({ entitlements: cached, loading: !loaded }));

  useEffect(() => {
    const sync = () => setState({ entitlements: cached, loading: !loaded });
    subscribers.add(sync);
    
    
    if (!loaded) void fetchEntitlements();

    
    
    const onFocus = () => {
      if (document.visibilityState === "visible") void refreshEntitlements();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      subscribers.delete(sync);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const feature = (key: string): FeatureEntitlement | undefined =>
    state.entitlements?.features?.[key];
  const isAllowed = (key: string): boolean => Boolean(feature(key)?.allowed);

  return {
    entitlements: state.entitlements,
    loading: state.loading,
    feature,
    isAllowed,
  };
}
