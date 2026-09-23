"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for the dashboard route group. Scoped here (rather than only at
 * the root) so a failure inside one dashboard page can be retried without
 * tearing down the whole application shell.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-bold text-on-surface">
        This page could not be loaded
      </h1>
      <p className="text-sm text-on-surface-variant">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button onClick={() => reset()}>
        <RefreshCw className="mr-1 h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
