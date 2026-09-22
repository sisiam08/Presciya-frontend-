"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Building2,
  ShieldCheck,
  Mail,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";

interface PendingInvitation {
  id: string;
  token: string;
  role: string;
  workspace?: { id: string; name: string; type?: string };
  invitedBy?: { name?: string };
  expiresAt?: string;
}

/**
 * Lists the signed-in user's pending workspace invitations. Shown after login
 * for users whose only memberships are pending (they have no active workspace
 * yet) so they can accept and get access.
 */
export default function PendingInvitationsPage() {
  const router = useRouter();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    const isAuthed =
      typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuthed) {
      setUnauthenticated(true);
      setLoading(false);
      return;
    }

    apiClient
      .get<any>(API_ROUTES.WORKSPACES.PENDING_INVITATIONS)
      .then((res) => setInvitations(res.data?.data || res.data || []))
      .catch((e) =>
        showError(
          e?.response?.data?.message || "Failed to load your invitations",
        ),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = async (inv: PendingInvitation) => {
    setWorking(inv.id);
    try {
      const res = await apiClient.post<any>(
        API_ROUTES.WORKSPACES.ACCEPT_INVITATION,
        { token: inv.token },
      );
      const membership = res.data?.data || res.data;
      const workspaceId =
        membership?.workspace?.id ||
        membership?.workspaceId ||
        inv.workspace?.id ||
        null;
      if (workspaceId) localStorage.setItem("activeWorkspaceId", workspaceId);
      success("Invitation accepted");
      router.push("/dashboard");
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to accept the invitation");
      setWorking(null);
    }
  };

  const decline = async (inv: PendingInvitation) => {
    setWorking(inv.id);
    try {
      await apiClient.post(API_ROUTES.WORKSPACES.REJECT_INVITATION, {
        token: inv.token,
      });
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      success("Invitation declined");
    } catch (e: any) {
      showError(
        e?.response?.data?.message || "Failed to decline the invitation",
      );
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-on-surface">
          Your invitations
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Accept a workspace invitation to get started.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      )}

      {unauthenticated && !loading && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-8 text-center">
          <Mail className="mx-auto mb-3 h-6 w-6 text-primary" />
          <p className="text-sm text-on-surface-variant">
            Please log in to view your invitations.
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button>
              <LogIn className="mr-2 h-4 w-4" /> Log in
            </Button>
          </Link>
        </div>
      )}

      {!loading && !unauthenticated && invitations.length === 0 && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-8 text-center text-sm text-on-surface-variant">
          You have no pending invitations.
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface p-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-on-surface">
                  {inv.workspace?.name || "Workspace"}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {inv.role}
                  {inv.invitedBy?.name ? ` · invited by ${inv.invitedBy.name}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => decline(inv)}
                disabled={working === inv.id}
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => accept(inv)}
                disabled={working === inv.id}
              >
                {working === inv.id && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
