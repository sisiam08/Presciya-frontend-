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
 * Loads the current workspace's plan entitlements (admin-configurable). Used to
 * gate / blur features the plan does not include.
 */
export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .get<any>(API_ROUTES.SUBSCRIPTION.ENTITLEMENTS)
      .then((res) => {
        if (active) setEntitlements(res.data?.data || res.data || null);
      })
      .catch(() => {
        if (active) setEntitlements(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const feature = (key: string): FeatureEntitlement | undefined =>
    entitlements?.features?.[key];
  const isAllowed = (key: string): boolean => Boolean(feature(key)?.allowed);

  return { entitlements, loading, feature, isAllowed };
}
