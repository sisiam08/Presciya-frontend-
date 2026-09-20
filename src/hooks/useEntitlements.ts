"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

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
 * Loads the current workspace's plan entitlements (admin-configurable). Used to
 * gate / blur features the plan does not include.
 */
export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  // Guards against out-of-order responses when a focus refresh races the mount.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await apiClient.get<any>(
        API_ROUTES.SUBSCRIPTION.ENTITLEMENTS,
      );
      if (id === requestId.current) {
        setEntitlements(res.data?.data || res.data || null);
      }
    } catch {
      if (id === requestId.current) setEntitlements(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh usage when the user comes back to the tab so a day rollover is
  // reflected without requiring a manual reload.
  useRefreshOnFocus(load);

  const feature = (key: string): FeatureEntitlement | undefined =>
    entitlements?.features?.[key];
  const isAllowed = (key: string): boolean => Boolean(feature(key)?.allowed);

  return { entitlements, loading, feature, isAllowed };
}
