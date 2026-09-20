"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

export interface AvailabilityEntry {
  enabled: boolean;
}

export type Availability = Record<string, AvailabilityEntry>;

/**
 * Public feature availability (GET /system/availability). These are features
 * that exist in the product but are not yet part of the public release — the
 * enabled state is admin-controlled (FeatureFlag), never hardcoded in the
 * client. Fails closed: if the request fails, gated surfaces stay unavailable.
 */
export function useAvailability() {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .get<any>(API_ROUTES.SYSTEM.AVAILABILITY)
      .then((res) => {
        if (active) setAvailability(res.data?.data || res.data || null);
      })
      .catch(() => {
        if (active) setAvailability(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  /** True only when the backend explicitly reports the surface as enabled. */
  const isEnabled = (key: string): boolean =>
    availability?.[key]?.enabled === true;

  return { availability, loading, isEnabled };
}
