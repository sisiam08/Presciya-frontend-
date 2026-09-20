"use client";

import React from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";

interface FeatureGateProps {
  /** Feature key, e.g. "finance", "visiting_fees", "appointments". */
  feature: string;
  /** Human label used in the locked message. */
  label: string;
  children: React.ReactNode;
}

/**
 * Blurs its children and shows an upgrade prompt when the active plan does not
 * include the feature. Plan contents are admin-configurable — nothing here is
 * hardcoded.
 */
export default function FeatureGate({
  feature,
  label,
  children,
}: FeatureGateProps) {
  const { entitlements, loading, isAllowed } = useEntitlements();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isAllowed(feature)) return <>{children}</>;

  return (
    <div className="relative">
      <div
        className="pointer-events-none select-none opacity-40 blur-[6px]"
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface/95 p-6 text-center shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-on-surface">
            {label} is not included in your plan
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            You are currently on the{" "}
            <span className="font-semibold">
              {entitlements?.plan?.name || "Free"}
            </span>{" "}
            plan. Upgrade your subscription to unlock {label}.
          </p>
          <Link href="/dashboard/subscription" className="mt-5 inline-block">
            <Button>View plans &amp; upgrade</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
