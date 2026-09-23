"use client";

import Link from "next/link";
import { ShieldAlert, Clock, XCircle, ArrowRight } from "lucide-react";
import { useMe } from "@/hooks/useMe";

type Status = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const CONFIG: Record<
  Exclude<Status, "APPROVED">,
  { icon: React.ElementType; className: string; title: string; body: string }
> = {
  PENDING: {
    icon: ShieldAlert,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
    title: "Professional verification pending",
    body: "Submit your BMDC / registration details to unlock official prescription printing and downloads.",
  },
  UNDER_REVIEW: {
    icon: Clock,
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300",
    title: "Under professional verification",
    body: "Our team is reviewing your credentials. You can keep preparing drafts; official print/download unlocks after approval.",
  },
  REJECTED: {
    icon: XCircle,
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
    title: "Verification needs attention",
    body: "Your verification was rejected. Review the feedback and resubmit your details.",
  },
};

/**
 * Clearly surfaces the professional verification state instead of silently
 * disabling features (Section 7.4).
 */
export default function VerificationNotice() {
  // Shared single-flight `/auth/me` — this component and the chambers page both
  // need `profile.verificationStatus`, and previously each fetched it itself.
  const { profile } = useMe();
  const status = (profile?.verificationStatus as Status | undefined) ?? null;

  if (!status || status === "APPROVED") return null;

  const cfg = CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${cfg.className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold">{cfg.title}</p>
          <p className="text-xs opacity-90">{cfg.body}</p>
        </div>
      </div>
      <Link
        href="/dashboard/profile"
        className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-bold underline-offset-2 hover:underline"
      >
        Go to profile <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
