"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

/**
 * Guards the Institution admin panel. Only the institution OWNER/ADMIN may
 * view it — a DOCTOR/MANAGER/ASSISTANT member of a hospital workspace is
 * redirected to their dashboard. (The backend re-checks every mutation.)
 */
export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
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
  }, [router]);

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
