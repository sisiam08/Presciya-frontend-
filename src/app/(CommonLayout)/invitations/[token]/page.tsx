"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Building2,
  ShieldCheck,
  LogIn,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";

type PageStatus =
  | "loading"
  | "unauthenticated"
  | "ready"
  | "invalid"
  | "accepted"
  | "rejected";

interface InvitationInfo {
  workspaceName?: string | null;
  workspaceType?: string | null;
  role?: string;
  email?: string;
  expiresAt?: string;
}

/**
 * Handles the workspace invitation link sent by email
 * (http://.../invitations/<token>). If the invitee is not signed in they are
 * asked to log in first (returning here afterwards); once signed in they can
 * accept or decline the invitation.
 */
export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;
  const { success, error: showError } = useNotification();

  const [status, setStatus] = useState<PageStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const redirectPath = token ? `/invitations/${token}` : "/dashboard";

  useEffect(() => {
    if (!token) return;

    const isAuthed =
      typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!isAuthed) {
      setStatus("unauthenticated");
      return;
    }

    let active = true;
    apiClient
      .get<any>(API_ROUTES.WORKSPACES.VERIFY_INVITATION(token))
      .then((res) => {
        if (!active) return;
        setInvitation(res.data?.data || res.data);
        setStatus("ready");
      })
      .catch((e) => {
        if (!active) return;
        setMessage(
          e?.response?.data?.message ||
            "This invitation is invalid or has expired.",
        );
        setStatus("invalid");
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setWorking(true);
    try {
      const res = await apiClient.post<any>(
        API_ROUTES.WORKSPACES.ACCEPT_INVITATION,
        { token },
      );
      const membership = res.data?.data || res.data;
      const workspaceId =
        membership?.workspace?.id || membership?.workspaceId || null;
      if (workspaceId) localStorage.setItem("activeWorkspaceId", workspaceId);
      success("Invitation accepted");
      setStatus("accepted");
      setTimeout(
        () => router.push("/dashboard"),
        1200,
      );
    } catch (e: any) {
      showError(
        e?.response?.data?.message || "Failed to accept the invitation",
      );
    } finally {
      setWorking(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setWorking(true);
    try {
      await apiClient.post(API_ROUTES.WORKSPACES.REJECT_INVITATION, { token });
      setStatus("rejected");
    } catch (e: any) {
      showError(
        e?.response?.data?.message || "Failed to decline the invitation",
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-xl font-black tracking-tighter text-primary">
            Presciya
          </span>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-10 text-on-surface-variant">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Checking your invitation…</p>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              You&apos;ve been invited
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Log in with the email address that received the invitation to
              accept or decline it.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`}>
                <Button className="w-full">
                  <LogIn className="mr-2 h-4 w-4" /> Log in to continue
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="w-full">
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Invitation unavailable
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "ready" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Workspace invitation
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              You&apos;ve been invited to join
            </p>
            <p className="mt-1 text-base font-bold text-on-surface">
              {invitation?.workspaceName || "a workspace"}
            </p>
            {invitation?.role && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                <ShieldCheck className="h-3.5 w-3.5" />
                Role: {invitation.role}
              </span>
            )}
            {invitation?.email && (
              <p className="mt-3 text-xs text-on-surface-variant">
                Invited email:{" "}
                <span className="font-medium text-on-surface">
                  {invitation.email}
                </span>
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={handleAccept} disabled={working} className="w-full">
                {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept invitation
              </Button>
              <Button
                variant="ghost"
                onClick={handleDecline}
                disabled={working}
                className="w-full text-on-surface-variant"
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        {status === "accepted" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Invitation accepted
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              You now have access to{" "}
              {invitation?.workspaceName || "the workspace"}. Redirecting…
            </p>
          </div>
        )}

        {status === "rejected" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
              <XCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Invitation declined
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              You declined the invitation. You can close this page.
            </p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
