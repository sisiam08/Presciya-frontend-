"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Chamber } from "@/types";
import {
  persistActiveChamber,
  useActiveChamber,
} from "@/hooks/useActiveChamber";

interface ChamberGateProps {
  /** Feature name used in the notice, e.g. "Appointments". */
  label: string;
  children: React.ReactNode;
}

/**
 * Chamber-dependent features are only usable while the doctor is operating in a
 * chamber. In Personal mode (no chamber selected) the page is blurred behind a
 * notice with a one-click chamber picker.
 */
export default function ChamberGate({ label, children }: ChamberGateProps) {
  const activeChamberId = useActiveChamber();
  const [chambers, setChambers] = useState<Chamber[] | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .get<any>(API_ROUTES.CHAMBERS.LIST)
      .then((res) => {
        if (!active) return;
        const list = res.data?.data || res.data || [];
        setChambers(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setChambers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (chambers === null) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const activeChamber = chambers.find((c) => c.id === activeChamberId);
  if (activeChamber) return <>{children}</>;

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
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-on-surface">
            {label} are available in Chamber mode
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            You are working in your Personal workspace. Switch to a chamber to
            manage {label.toLowerCase()}.
          </p>

          {chambers.length > 0 ? (
            <div className="mt-5 space-y-2 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Switch to a chamber
              </p>
              {chambers.map((chamber) => (
                <button
                  key={chamber.id}
                  type="button"
                  onClick={() => persistActiveChamber(chamber.id)}
                  className="w-full flex items-center gap-3 rounded-lg border border-outline-variant px-3 py-2 text-left text-sm text-on-surface transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {chamber.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate font-medium">
                    {chamber.name}
                  </span>
                </button>
              ))}
              <p className="pt-1 text-[11px] text-on-surface-variant">
                You can also switch chambers any time from the workspace switcher
                in the sidebar.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-on-surface-variant">
                You don&apos;t have a chamber yet. Create one to start managing{" "}
                {label.toLowerCase()}.
              </p>
              <Link href="/dashboard/chambers" className="mt-4 inline-block">
                <Button>Create a chamber</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
