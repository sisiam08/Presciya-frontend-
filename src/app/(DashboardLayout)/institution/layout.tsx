"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComingSoon from "@/components/ui/ComingSoon";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useAvailability } from "@/hooks/useAvailability";

/**
 * Guards the Institution admin panel. Only the institution OWNER/ADMIN may
 * view it — a DOCTOR/MANAGER/ASSISTANT member of a hospital workspace is
 * redirected to their dashboard. (The backend re-checks every mutation.)
 *
 * Institution management is not part of the current public release, so while
 * the admin-controlled availability flag is off the whole section renders a
 * "coming soon" surface. The underlying pages are kept intact for later.
 */
export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isEnabled, loading: availabilityLoading } = useAvailability();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const institutionAvailable = isEnabled("institution");

  useEffect(() => {
    if (!institutionAvailable) return;

    const wsId =
      typeof window !== "undefined"
        ? localStorage.getItem("activeWorkspaceId")
        : null;

    apiClient
      .get<any>(API_ROUTES.WORKSPACES.LIST)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const active = list.find((w: any) => w.id === wsId) || list[0];
        const ok =
          active?.type === "INSTITUTION" &&
          (active?.role === "OWNER" || active?.role === "ADMIN");
        setAllowed(Boolean(ok));
        if (!ok) router.replace("/dashboard");
      })
      .catch(() => {
        setAllowed(false);
        router.replace("/dashboard");
      });
  }, [router, institutionAvailable]);

  if (availabilityLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!institutionAvailable) {
    return (
      <ComingSoon
        title="Hospital & Clinic Management"
        description="Institution, hospital and clinic features are currently under development and will be available soon. Your existing data is safe — nothing has been removed."
        action={
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!allowed) return null;
  return <>{children}</>;
}
