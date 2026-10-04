"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";

interface FeatureGateProps {
  
  feature: string;
  
  label: string;
  
  variant?: "section" | "inline";
  children: React.ReactNode;
}


export default function FeatureGate({
  feature,
  label,
  variant = "section",
  children,
}: FeatureGateProps) {
  const { entitlements, loading, isAllowed } = useEntitlements();
  
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isAllowed(feature)) return <>{children}</>;

  const planName = entitlements?.plan?.name || "Free";

  
  
  
  
  
  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container/40 p-3">
        <div
          className="pointer-events-none select-none overflow-hidden rounded-lg opacity-40 blur-[3px]"
          aria-hidden="true"
        >
          {children}
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface p-3 sm:flex-row sm:items-start">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-on-surface">
              {label} is not included in your plan
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              You are currently on the{" "}
              <span className="font-semibold">{planName}</span> plan.
            </p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="flex-shrink-0 sm:self-center"
          >
            <Button size="sm" variant="outline">
              View plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  
  
  
  
  
  
  
  
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-on-surface">
          {label} is not included in your plan
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          You are currently on the{" "}
          <span className="font-semibold">{planName}</span> plan.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Link href="/dashboard/subscription">
            <Button>View plans &amp; upgrade</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
