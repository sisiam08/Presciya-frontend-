"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  CalendarDays,
  Bell,
  UserCircle,
  CreditCard,
  Settings,
  Stethoscope,
  ShieldCheck,
  BadgeCheck,
  ScrollText,
  ToggleRight,
  PackageCheck,
  Layers,
  Mail,
  Settings2,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sun,
  Moon,
  Pill,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { markSessionPresent } from "@/lib/auth-session";
import {
  Workspace,
  WorkspaceRole,
  WorkspaceType,
  SystemRole,
  Chamber,
} from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useDismissable } from "@/hooks/useDismissable";
import { refreshUnreadCount, useUnreadCount } from "@/hooks/useUnreadCount";
import { useAvailability } from "@/hooks/useAvailability";
import {
  persistActiveChamber,
  readActiveChamberId,
  useActiveChamber,
} from "@/hooks/useActiveChamber";

// ─── Nav Item Component ────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
  highlight,
  soon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: number;
  highlight?: boolean;
  /** Marks a section that ships in the app but is not publicly available yet. */
  soon?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative
        ${soon && !active ? "opacity-60" : ""}
        ${
          active
            ? "bg-primary text-on-primary shadow-xs font-semibold"
            : highlight
            ? "text-primary hover:bg-primary/10"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-surface-container-high"
        }`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 ${
          active
            ? "text-on-primary"
            : highlight
            ? "text-primary"
            : "text-on-surface-variant"
        }`}
      />
      <span className="truncate">{label}</span>
      {soon && (
        <span className="ml-auto flex-shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
          Soon
        </span>
      )}
      {!soon && badge != null && badge > 0 && (
        <span className="ml-auto flex-shrink-0 text-[10px] font-bold bg-primary text-on-primary rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 mb-1 mt-4 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
      {label}
    </p>
  );
}

const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/verifications", label: "Verifications", icon: BadgeCheck },
  { href: "/dashboard/admin/plans", label: "Plans & Pricing", icon: PackageCheck },
  { href: "/dashboard/admin/features", label: "Feature Flags", icon: ToggleRight },
  { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/dashboard/admin/medicines", label: "Medicine DB", icon: Pill },
  { href: "/dashboard/admin/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

// Workspace groups. A "group" is simply the existing WorkspaceType — no
// duplicate workspaceGroup/workspaceMode concept is introduced.
const WORKSPACE_GROUPS: WorkspaceType[] = [
  WorkspaceType.PERSONAL,
  WorkspaceType.CHAMBER,
  WorkspaceType.INSTITUTION,
];

const GROUP_LABELS: Record<string, string> = {
  [WorkspaceType.PERSONAL]: "Personal",
  [WorkspaceType.CHAMBER]: "Chambers",
  [WorkspaceType.INSTITUTION]: "Hospitals & Clinics",
};

const groupLabel = (type?: WorkspaceType) =>
  (type && GROUP_LABELS[type]) || "Workspace";

export default function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout: authLogout } = useAuth();
  // Institution / hospital / clinic surfaces are not part of the public release
  // yet. Admin-controlled (FeatureFlag) — never hardcoded here.
  const { isEnabled } = useAvailability();
  const institutionAvailable = isEnabled("institution");
  const [mounted, setMounted] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  // Chambers live INSIDE a workspace (there are no CHAMBER-type workspaces), so
  // the "Chambers" group lists the active workspace's chambers and the selected
  // one becomes the operating chamber for new prescriptions/appointments.
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const activeChamberId = useActiveChamber();
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const wsMenuRef = useRef<HTMLDivElement | null>(null);

  // Close the workspace menu on outside click or Escape.
  useDismissable(wsMenuRef, () => setWsMenuOpen(false), wsMenuOpen);
  // Shared with the notifications page so the badge never goes stale.
  const unreadCount = useUnreadCount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstitution, setIsInstitution] = useState(false);

  const isInAdminPanel = pathname.startsWith("/dashboard/admin");

  // The Institution admin panel is only for the institution OWNER/ADMIN — a
  // DOCTOR/MANAGER/ASSISTANT who is merely a member must never see it.
  const isInstitutionManager = (ws?: Workspace | null) =>
    ws?.type === "INSTITUTION" &&
    (ws?.role === WorkspaceRole.OWNER || ws?.role === WorkspaceRole.ADMIN);

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const wsRes = await apiClient.get<any>(API_ROUTES.WORKSPACES.LIST);
        const wsData: Workspace[] = wsRes.data?.data || wsRes.data || [];
        setWorkspaces(wsData);
        if (wsData.length > 0) {
          const savedWsId = localStorage.getItem("activeWorkspaceId");
          const active = wsData.find((w) => w.id === savedWsId) || wsData[0];
          setActiveWorkspace(active);
          setIsInstitution(isInstitutionManager(active));
          // Persist the resolved workspace so URL-scoped pages can use it.
          if (active?.id) localStorage.setItem("activeWorkspaceId", active.id);
        }

        // Chambers of the active workspace (may be none, or the call is not
        // permitted for this workspace type — treat both as "no chambers").
        const chamberRes = await apiClient
          .get<any>(API_ROUTES.CHAMBERS.LIST)
          .catch(() => ({ data: [] }));
        const chamberData: Chamber[] =
          chamberRes.data?.data || chamberRes.data || [];
        setChambers(Array.isArray(chamberData) ? chamberData : []);

        // Drop a stored chamber that no longer exists in this workspace.
        const savedChamberId = readActiveChamberId();
        if (
          savedChamberId &&
          !chamberData.some((c: Chamber) => c.id === savedChamberId)
        ) {
          persistActiveChamber("");
        }

      await refreshUnreadCount();

        if (user?.systemRole === SystemRole.SUPER_ADMIN || (user as any)?.role === "ADMIN") {
          setIsAdmin(true);
        }
      } catch {
        // silent fail
      }
    };
    if (user) loadData();
  }, [user]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const switchWorkspace = async (ws: Workspace) => {
    if (ws.type === "INSTITUTION" && !institutionAvailable) {
      toast({
        title: "Coming soon",
        description:
          "Institution workspaces are still under development and will be available soon.",
      });
      setWsMenuOpen(false);
      return;
    }
    try {
      // Identity comes from the session cookie server-side; only workspaceId is sent.
      const res = await apiClient.post<any>("/auth/switch-workspace", {
        workspaceId: ws.id,
      });
      // The backend already re-issued the session cookies on this response;
      // only record the non-secret session marker.
      markSessionPresent();
      setActiveWorkspace(ws);
      localStorage.setItem("activeWorkspaceId", ws.id);
      // Leaving the personal workspace always drops back to the current-scope
      // default — All Workspaces must be re-enabled explicitly from Settings.
      localStorage.setItem("workspaceScope", "current");
      // Chambers belong to a workspace, so a fresh workspace starts with no
      // chamber selected.
      persistActiveChamber("");
      setIsInstitution(isInstitutionManager(ws));
      setWsMenuOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast({
        title: "Workspace Switch Error",
        description: e?.response?.data?.message || "Failed to switch workspace",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    void authLogout();
    localStorage.removeItem("activeWorkspaceId");
  };

  // ── Workspace groups ───────────────────────────────────────────────────────
  // A group is the existing WorkspaceType. The database has no CHAMBER-type
  // workspaces — chambers are entities INSIDE a workspace — so the Chambers
  // group lists the active workspace's chambers and choosing one sets the
  // operating chamber instead of switching workspace.
  const activeType = activeWorkspace?.type;
  const activeChamber = chambers.find((c) => c.id === activeChamberId) ?? null;

  const activeGroup: WorkspaceType = activeChamber
    ? WorkspaceType.CHAMBER
    : (activeType ?? WorkspaceType.PERSONAL);

  const switchableWorkspaces =
    activeGroup === WorkspaceType.CHAMBER
      ? []
      : workspaces.filter((w) => w.type === activeGroup);

  const contextLabel =
    activeGroup === WorkspaceType.CHAMBER ? "Chambers" : groupLabel(activeType);

  const selectChamber = (chamber: Chamber) => {
    persistActiveChamber(chamber.id);
    setWsMenuOpen(false);
  };

  const clearChamber = () => {
    persistActiveChamber("");
  };

  // Only groups the user can actually operate in, in a stable order.
  const availableGroups = WORKSPACE_GROUPS.filter((type) => {
    if (type === WorkspaceType.CHAMBER) return chambers.length > 0;
    return workspaces.some((w) => w.type === type);
  });

  const changeWorkspaceGroup = (type: WorkspaceType) => {
    if (type === activeGroup) return;

    if (type === WorkspaceType.CHAMBER) {
      if (chambers.length === 0) {
        toast({
          title: "No chambers yet",
          description: "Create a chamber to switch into chamber mode.",
        });
        return;
      }
      selectChamber(chambers[0]);
      return;
    }

    // Moving to a workspace group drops the chamber context.
    clearChamber();

    if (type === WorkspaceType.INSTITUTION && !institutionAvailable) {
      toast({
        title: "Coming soon",
        description:
          "Institution workspaces are still under development and will be available soon.",
      });
      return;
    }

    const target = workspaces.find((w) => w.type === type);
    if (!target) {
      toast({
        title: "No workspace available",
        description: `You don't have any ${groupLabel(type).toLowerCase()} workspaces.`,
      });
      return;
    }

    if (target.id === activeWorkspace?.id) {
      // Same workspace — we only needed to leave chamber mode.
      setWsMenuOpen(false);
      return;
    }

    // Reuses the existing switch flow; the backend re-validates access.
    switchWorkspace(target);
  };

  // ─── ADMIN PANEL SIDEBAR (SOFT COLOR PALETTE) ──────────────────────────────
  if (isInAdminPanel) {
    return (
      <aside className="w-64 shrink-0 flex flex-col h-screen sticky top-0 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant overflow-hidden">
        {/* Admin Soft Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-base text-on-surface">Presciya Admin</p>
            <p className="text-[10px] text-on-surface-variant font-medium">System Controls</p>
          </div>
        </div>

        {/* Return to App Button (Soft Pill) */}
        <div className="px-3 pt-3 flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch to Doctor Portal</span>
          </Link>
        </div>

        {/* Admin Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          <SectionLabel label="Administration" />
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={Icon}
                active={active}
              />
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-outline-variant flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">
                {user?.name || "Super Admin"}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              {mounted && resolvedTheme === "dark" ? (
                <><Sun className="h-3.5 w-3.5 text-amber-400" /> Light</>
              ) : (
                <><Moon className="h-3.5 w-3.5 text-slate-600" /> Dark</>
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ─── REGULAR USER / DOCTOR SIDEBAR ─────────────────────────────────────────
  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen sticky top-0 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-outline-variant flex-shrink-0">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <Stethoscope className="h-4 w-4 text-on-primary" />
        </div>
        <span className="font-bold text-base text-on-surface">Presciya</span>
      </div>

      {/* Workspace Switcher */}
      {workspaces.length > 0 && (
        <div className="px-3 pt-3 flex-shrink-0" ref={wsMenuRef}>
          <button
            onClick={() => setWsMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container dark:bg-surface-container-high border border-outline-variant text-sm text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="flex-1 text-left truncate font-medium text-xs">
              {activeChamber?.name ||
                activeWorkspace?.name ||
                "Select Workspace"}
            </span>
            {wsMenuOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-on-surface-variant" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" />
            )}
          </button>
          {wsMenuOpen && (
            <div className="mt-1 rounded-lg border border-outline-variant bg-surface dark:bg-surface-container overflow-hidden shadow-md z-50">
              {/* Step 1 — workspace group (only groups the user belongs to). */}
              {availableGroups.length > 1 && (
                <div className="px-2 pt-2 pb-1.5 border-b border-outline-variant/40">
                  <p className="px-1 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                    Workspace group
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableGroups.map((group) => {
                      const isCurrent = group === activeGroup;
                      const isSoon =
                        group === WorkspaceType.INSTITUTION &&
                        !institutionAvailable;
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => changeWorkspaceGroup(group)}
                          disabled={isSoon}
                          title={
                            isSoon
                              ? "Institution workspaces are coming soon"
                              : undefined
                          }
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
                            isCurrent
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                          } ${isSoon ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {groupLabel(group)}
                          {isSoon ? " · Soon" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2 — the entries of the active group. */}
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant/40">
                {contextLabel}
              </p>
              {activeGroup === WorkspaceType.CHAMBER
                ? chambers.map((chamber) => (
                    <button
                      key={chamber.id}
                      onClick={() => selectChamber(chamber)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-surface-container-high ${
                        activeChamberId === chamber.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-on-surface"
                      }`}
                    >
                      <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-primary font-bold">
                          {chamber.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {chamber.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {activeWorkspace?.name || "Chamber"}
                        </p>
                      </div>
                    </button>
                  ))
                : switchableWorkspaces.map((ws) => {
                    const wsSoon =
                      ws.type === "INSTITUTION" && !institutionAvailable;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => switchWorkspace(ws)}
                        title={
                          wsSoon
                            ? "Institution workspaces are coming soon"
                            : undefined
                        }
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-surface-container-high ${
                          wsSoon ? "opacity-60" : ""
                        } ${
                          activeWorkspace?.id === ws.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-on-surface"
                        }`}
                      >
                        <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-primary font-bold">
                            {ws.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {ws.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant capitalize">
                            {ws.type?.toLowerCase()}
                          </p>
                        </div>
                        {wsSoon && (
                          <span className="flex-shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                            Soon
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        <SectionLabel label="Main" />
        <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={isActive("/dashboard", true)} />
        <NavItem href="/dashboard/prescriptions" label="Prescriptions" icon={FileText} active={isActive("/dashboard/prescriptions")} />
        <NavItem href="/dashboard/patients" label="Patients" icon={Users} active={isActive("/dashboard/patients")} />
        <NavItem href="/dashboard/chambers" label="Chambers" icon={Building2} active={isActive("/dashboard/chambers")} />
        <NavItem href="/dashboard/appointments" label="Appointments" icon={CalendarDays} active={isActive("/dashboard/appointments")} />
        <NavItem href="/dashboard/finance" label="Finance" icon={Wallet} active={isActive("/dashboard/finance")} />
        <NavItem href="/dashboard/notifications" label="Notifications" icon={Bell} active={isActive("/dashboard/notifications")} badge={unreadCount} />

        {isInstitution && (
          <>
            <SectionLabel
              label={
                institutionAvailable ? "Institution" : "Institution · Coming Soon"
              }
            />
            <NavItem href="/institution" label="Overview" icon={Building2} active={isActive("/institution")} soon={!institutionAvailable} />
            <NavItem href="/institution/doctors" label="Doctors" icon={Users} active={isActive("/institution/doctors")} soon={!institutionAvailable} />
            <NavItem href="/institution/departments" label="Departments" icon={Layers} active={isActive("/institution/departments")} soon={!institutionAvailable} />
            <NavItem href="/institution/invitations" label="Invitations" icon={Mail} active={isActive("/institution/invitations")} soon={!institutionAvailable} />
            <NavItem href="/institution/settings" label="Settings" icon={Settings2} active={isActive("/institution/settings")} soon={!institutionAvailable} />
          </>
        )}

        {(isAdmin || user?.systemRole === SystemRole.SUPER_ADMIN) && (
          <>
            <SectionLabel label="System Admin" />
            <NavItem href="/dashboard/admin" label="Admin Panel" icon={ShieldCheck} active={false} highlight={true} />
          </>
        )}

        <SectionLabel label="Account" />
        <NavItem href="/dashboard/profile" label="Profile" icon={UserCircle} active={isActive("/dashboard/profile")} />
        <NavItem href="/dashboard/subscription" label="Subscription" icon={CreditCard} active={isActive("/dashboard/subscription")} />
        <NavItem href="/dashboard/settings" label="Settings" icon={Settings} active={isActive("/dashboard/settings")} />
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-outline-variant flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            {mounted && resolvedTheme === "dark" ? (
              <><Sun className="h-3.5 w-3.5 text-amber-400" /> Light</>
            ) : (
              <><Moon className="h-3.5 w-3.5 text-slate-600" /> Dark</>
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
