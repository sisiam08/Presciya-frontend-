"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Workspace } from "@/types";

const STORAGE_KEY = "financeScope";

// Mirrors the backend finance role mapping (prisma/seed.ts). UI-only — the
// backend re-checks every action against the target workspace's role.
const FINANCE_ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ["view", "create", "update", "delete", "report"],
  ADMIN: ["view", "create", "update", "delete", "report"],
  MANAGER: ["view", "create", "update", "report"],
  DOCTOR: ["view", "create", "report"],
  ASSISTANT: ["view"],
};

/**
 * Manages the Finance workspace scope ("all" or a specific workspace id). The
 * scope is only a selector — the backend re-derives authorized workspaces from
 * memberships, so a forged value cannot grant access.
 */
export function useFinanceScope() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [scope, setScopeState] = useState<string>("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeWsId =
      (typeof window !== "undefined" &&
        localStorage.getItem("activeWorkspaceId")) ||
      "";
    const saved =
      (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) ||
      "";
    setActiveWorkspaceId(activeWsId);
    setScopeState(saved || activeWsId);

    apiClient
      .get<any>(API_ROUTES.WORKSPACES.LIST)
      .then((res) => setWorkspaces(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setScope = useCallback((value: string) => {
    setScopeState(value);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, value);
  }, []);

  const scopeQuery =
    scope === "all" ? "scope=all" : scope ? `workspaceId=${scope}` : "";

  // Appends the scope query params to a finance endpoint path.
  const withScope = useCallback(
    (path: string) => {
      if (!scopeQuery) return path;
      return path.includes("?") ? `${path}&${scopeQuery}` : `${path}?${scopeQuery}`;
    },
    [scopeQuery],
  );

  const scopeLabel =
    scope === "all"
      ? "All Workspaces"
      : workspaces.find((w) => w.id === scope)?.name || "Current Workspace";

  // Role of the workspace writes will target (the scoped workspace, or the
  // active workspace in "All Workspaces" mode).
  const roleWorkspaceId = scope === "all" ? activeWorkspaceId : scope;
  const role = workspaces.find((w) => w.id === roleWorkspaceId)?.role;
  const allowed = role ? FINANCE_ROLE_PERMISSIONS[role] ?? [] : [];
  const can = {
    view: allowed.includes("view"),
    create: allowed.includes("create"),
    update: allowed.includes("update"),
    delete: allowed.includes("delete"),
    report: allowed.includes("report"),
  };

  return {
    workspaces,
    scope,
    setScope,
    scopeQuery,
    withScope,
    scopeLabel,
    role,
    can,
    loading,
  };
}
