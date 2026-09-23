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

/**
 * Shared, single-flight entitlements store.
 *
 * Entitlements are read by every `FeatureGate` and by several pages. With the
 * previous per-hook state, a page with four gates (e.g. Settings) issued FOUR
 * identical `GET /subscription/entitlements` requests on mount and again on
 * every focus. This module keeps one cache and one in-flight promise, so any
 * number of consumers costs exactly one request.
 *
 * The cache is workspace-scoped and the workspace switcher performs a full page
 * reload (`window.location.reload()`), so a workspace change always starts from
 * a clean store — entitlements can never leak across workspaces.
 */
let cached: Entitlements | null = null;
let loaded = false;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

const notify = () => subscribers.forEach((fn) => fn());

const fetchEntitlements = (): Promise<void> => {
  // Single-flight: concurrent callers share one request.
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

/** Drops the cache and refetches (e.g. after a plan change). */
export const refreshEntitlements = (): Promise<void> => {
  loaded = false;
  return fetchEntitlements();
};

/**
 * Loads the current workspace's plan entitlements (admin-configurable). Used to
 * gate / blur features the plan does not include.
 */
export function useEntitlements() {
  const [state, setState] = useState<{
    entitlements: Entitlements | null;
    loading: boolean;
  }>(() => ({ entitlements: cached, loading: !loaded }));

  useEffect(() => {
    const sync = () => setState({ entitlements: cached, loading: !loaded });
    subscribers.add(sync);
    // The useState initialiser already reflects the cache, so there is no
    // synchronous setState here — only the first fetch.
    if (!loaded) void fetchEntitlements();

    // A single global focus listener (not one per consumer) so a day rollover
    // is reflected without a manual reload, at the cost of one request.
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
