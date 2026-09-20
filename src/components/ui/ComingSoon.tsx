"use client";

import React from "react";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  /** Small pill label. Defaults to "Coming Soon". */
  badge?: string;
  /** Rendered inside the card, e.g. a "Back to dashboard" action. */
  action?: React.ReactNode;
}

/**
 * Consistent "under development" surface for features that ship in the codebase
 * but are not yet part of the public release (e.g. institution management).
 */
export default function ComingSoon({
  title,
  description,
  badge = "Coming Soon",
  action,
}: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-outline-variant bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Construction className="h-7 w-7" />
        </div>

        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          {badge}
        </span>

        <h1 className="mt-3 text-xl font-bold text-on-surface">{title}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-on-surface-variant">
          {description}
        </p>

        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
