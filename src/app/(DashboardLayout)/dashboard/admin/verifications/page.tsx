"use client";

import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Shield,
  User,
  AlertCircle,
  FileCheck,
  FileX,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, VERIFICATION_STATUS_CONFIG } from "@/lib/constants";
import { VerificationRequest, VerificationStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | VerificationStatus>("all");
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.ADMIN.VERIFICATIONS);
      setRequests(res.data?.data || res.data || []);
    } catch { setRequests([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Open the review panel and load the full request detail (which carries the
  // doctor profile incl. BMDC number).
  const openReview = async (req: VerificationRequest) => {
    setSelectedReq(req);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.VERIFICATION.GET(req.id));
      setDetail(res.data?.data || res.data);
    } catch {
      setDetail(null);
    }
    setLoadingDetail(false);
  };

  const closeReview = () => {
    setSelectedReq(null);
    setDetail(null);
  };

  // BMDC registration number of the applicant (doctor profiles only).
  const submittedData: any =
    detail?.submittedData ?? selectedReq?.submittedData ?? {};
  const bmdcNumber: string =
    detail?.profile?.bmdcNumber ||
    submittedData?.bmdcNumber ||
    submittedData?.registrationNo ||
    submittedData?.bmdcId ||
    "";
  const hasBmdc = Boolean(bmdcNumber);

  // The BMDC portal's input only accepts the 6-digit registration number
  // (without the letter prefix), so copy just the digits (last 6).
  const bmdcDigits = bmdcNumber.replace(/\D/g, "").slice(-6);

  // Copy the BMDC digits to the clipboard and open the official BMDC
  // verification portal in a new tab.
  const verifyBmdc = async () => {
    if (!bmdcNumber) return;
    const copyValue = bmdcDigits || bmdcNumber;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast({
        title: "BMDC number copied",
        description: `${copyValue} copied to clipboard. Paste it into the BMDC portal.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: `BMDC number: ${copyValue}. Please copy it manually.`,
        variant: "destructive",
      });
    }
    window.open("https://verify.bmdc.org.bd", "_blank", "noopener,noreferrer");
  };

  const handleAction = async (id: string, action: "under-review" | "approve" | "reject") => {
    setProcessing(true);
    try {
      const urls: Record<string, string> = {
        "under-review": API_ROUTES.VERIFICATION.UNDER_REVIEW(id),
        approve: API_ROUTES.VERIFICATION.APPROVE(id),
        reject: API_ROUTES.VERIFICATION.REJECT(id),
      };
      await apiClient.post(urls[action]);
      load();
      setSelectedReq(null);
      toast({ title: "Verification Updated", description: `Verification request marked as ${action}.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || `Failed to ${action}.`, variant: "destructive" });
    }
    setProcessing(false);
  };

  const pendingCount = requests.filter((r) => r.status === VerificationStatus.PENDING).length;
  const reviewCount = requests.filter((r) => r.status === VerificationStatus.UNDER_REVIEW).length;
  const approvedCount = requests.filter((r) => r.status === VerificationStatus.APPROVED).length;
  const rejectedCount = requests.filter((r) => r.status === VerificationStatus.REJECTED).length;

  const displayed = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const TABS: { key: "all" | VerificationStatus; label: string; count: number }[] = [
    { key: "all", label: "All Requests", count: requests.length },
    { key: VerificationStatus.PENDING, label: "Pending", count: pendingCount },
    { key: VerificationStatus.UNDER_REVIEW, label: "Under Review", count: reviewCount },
    { key: VerificationStatus.APPROVED, label: "Approved", count: approvedCount },
    { key: VerificationStatus.REJECTED, label: "Rejected", count: rejectedCount },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Verification Queue & Credentials
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review doctor medical licenses (BMDC) and institution registration credentials
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Bento KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{pendingCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Queue</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{reviewCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Under Active Review</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{approvedCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Approved Credentials</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <FileX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{rejectedCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rejected Submissions</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === t.key
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <span>{t.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              filter === t.key ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Detail Review Modal Drawer */}
      {selectedReq && (
        <div className="rounded-2xl border border-primary/30 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {selectedReq.user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedReq.user?.name || "User Request"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedReq.user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Type: {selectedReq.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    Submitted: {formatDateTime(selectedReq.submittedAt)}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      hasBmdc
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {loadingDetail
                      ? "BMDC: loading…"
                      : hasBmdc
                        ? `BMDC: ${bmdcNumber}`
                        : "No BMDC on file"}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={closeReview}>Close</Button>
          </div>

          {selectedReq.submittedData && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Submitted License & Verification Data
              </p>
              <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {JSON.stringify(selectedReq.submittedData, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              size="sm"
              variant="outline"
              onClick={verifyBmdc}
              disabled={processing || !hasBmdc}
              title={
                hasBmdc
                  ? `Copy ${bmdcDigits || bmdcNumber} and open verify.bmdc.org.bd`
                  : "No BMDC registration number on file"
              }
            >
              <BadgeCheck className="h-4 w-4 mr-1.5" /> Verify BMDC
            </Button>
            {selectedReq.status === VerificationStatus.PENDING && (
              <Button
                size="sm"
                onClick={() => handleAction(selectedReq.id, "under-review")}
                disabled={processing || !hasBmdc}
                title={!hasBmdc ? "BMDC registration number is required" : undefined}
              >
                <Shield className="h-4 w-4 mr-1.5" /> Start Review Process
              </Button>
            )}
            {[VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW].includes(selectedReq.status) && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() => handleAction(selectedReq.id, "approve")}
                  disabled={processing || !hasBmdc}
                  title={!hasBmdc ? "BMDC registration number is required" : undefined}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Approve Credential
                </Button>
                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold" onClick={() => handleAction(selectedReq.id, "reject")} disabled={processing}>
                  <XCircle className="h-4 w-4 mr-1.5" /> Reject Request
                </Button>
              </>
            )}
            {!hasBmdc && !loadingDetail && (
              <span className="text-xs font-semibold text-rose-500">
                BMDC registration number missing — only rejection is allowed.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <BadgeCheck className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No verification requests found</p>
            <p className="text-xs text-slate-400 mt-0.5">Filter criteria returned zero items</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {["Applicant", "Target Type", "Current Status", "Submitted Date", "Action"].map((h) => (
                    <th key={h} className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayed.map((req) => {
                  const cfg = VERIFICATION_STATUS_CONFIG[req.status] || { label: req.status, color: "bg-slate-100 text-slate-700" };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {req.user?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.user?.name || "—"}</p>
                            <p className="text-xs text-slate-400">{req.user?.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {req.type?.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-medium text-slate-500 dark:text-slate-400">{formatDateTime(req.submittedAt)}</td>
                      <td className="py-3.5 px-5">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => openReview(req)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
