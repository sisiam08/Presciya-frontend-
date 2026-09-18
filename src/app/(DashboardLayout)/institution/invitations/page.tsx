"use client";

import React, { useState, useEffect } from "react";
import { Mail, Plus, Clock, CheckCircle, XCircle, Trash2, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Invitation } from "@/types";
import { formatDateTime } from "@/lib/utils";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function InstitutionInvitationsPage() {
  const [sent, setSent] = useState<Invitation[]>([]);
  const [pending, setPending] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("DOCTOR");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"sent" | "received">("sent");

  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : null;

  const load = async () => {
    setLoading(true);
    try {
      if (workspaceId) {
        const sentRes = await apiClient.get<any>(API_ROUTES.WORKSPACES.INVITATIONS(workspaceId));
        setSent(sentRes.data?.data || sentRes.data || []);
      }
      const pendRes = await apiClient.get<any>(API_ROUTES.WORKSPACES.PENDING_INVITATIONS);
      setPending(pendRes.data?.data || pendRes.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !workspaceId) return;
    setSending(true);
    try {
      await apiClient.post(API_ROUTES.WORKSPACES.INVITE(workspaceId), { email: inviteEmail, role: inviteRole });
      setInviteEmail(""); setShowInvite(false);
      load();
      toast({ title: "Invitation Sent", description: `Invitation sent to ${inviteEmail}`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Invitation Error", description: e?.response?.data?.message || "Failed to send invitation.", variant: "destructive" });
    }
    setSending(false);
  };

  const cancelInvite = async (id: string) => {
    if (!workspaceId) return;
    try {
      await apiClient.delete(API_ROUTES.WORKSPACES.CANCEL_INVITATION(workspaceId, id));
      setSent((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Invitation Cancelled", description: "Invitation has been cancelled.", variant: "default" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to cancel invitation.", variant: "destructive" });
    }
  };

  const acceptInvite = async (id: string) => {
    try {
      await apiClient.post(API_ROUTES.WORKSPACES.ACCEPT_INVITATION, { invitationId: id });
      load();
      toast({ title: "Invitation Accepted", description: "You joined the workspace successfully.", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to accept invitation.", variant: "destructive" });
    }
  };

  const rejectInvite = async (id: string) => {
    try {
      await apiClient.post(API_ROUTES.WORKSPACES.REJECT_INVITATION, { invitationId: id });
      load();
      toast({ title: "Invitation Declined", description: "Invitation rejected.", variant: "default" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to reject invitation.", variant: "destructive" });
    }
  };

  const statusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED": return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case "REJECTED": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Invitations</h1>
          <p className="text-sm text-on-surface-variant">Send and manage doctor invitations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <Send className="h-4 w-4 mr-1" /> Invite Doctor
          </Button>
        </div>
      </div>

      {showInvite && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Send Invitation
          </h3>
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="doctor@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 min-w-48" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="text-sm border border-outline-variant rounded-lg px-3 py-2 bg-surface">
              <option value="DOCTOR">Doctor</option>
              <option value="MANAGER">Manager</option>
              <option value="ASSISTANT">Assistant</option>
            </select>
            <Button size="sm" onClick={sendInvite} disabled={sending}>{sending ? "Sending..." : "Send"}</Button>
            <Button variant="outline" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-outline-variant flex gap-1">
        {(["sent", "received"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            {t}
            {t === "received" && pending.length > 0 && (
              <span className="ml-1.5 text-xs bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : tab === "sent" ? (
        sent.length === 0 ? (
          <div className="text-center py-16 text-sm text-on-surface-variant">
            <Mail className="h-10 w-10 mx-auto mb-3 text-on-surface-variant/30" />
            No invitations sent.
          </div>
        ) : (
          <div className="space-y-2">
            {sent.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant bg-surface">
                <div className="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{inv.email}</p>
                  <p className="text-xs text-on-surface-variant">Role: {inv.role} · {formatDateTime(inv.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(inv.status)}
                  <span className="text-xs text-on-surface-variant capitalize">{inv.status?.toLowerCase()}</span>
                </div>
                {inv.status === "PENDING" && (
                  <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => cancelInvite(inv.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        pending.length === 0 ? (
          <div className="text-center py-16 text-sm text-on-surface-variant">
            No pending invitations.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{inv.workspace?.name || "Workspace"}</p>
                  <p className="text-xs text-on-surface-variant">Role: {inv.role} · {formatDateTime(inv.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptInvite(inv.id)}>Accept</Button>
                  <Button variant="outline" size="sm" onClick={() => rejectInvite(inv.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
