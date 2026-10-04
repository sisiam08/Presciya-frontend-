"use client";

import { useCallback } from "react";
import { toast as globalToast, useToast as useGlobalToast } from "@/components/ui/use-toast";

interface UseNotificationOptions {
  duration?: number;
}


export const errorTitleFor = (message: string): string => {
  const m = (message || "").toLowerCase();

  if (m.includes("limit exceeded")) return "Plan Limit Reached";
  if (m.includes("not included in the current plan") || m.includes("not included in your plan"))
    return "Feature Unavailable";
  if (m.includes("no active subscription")) return "Subscription Required";
  if (m.includes("feature is currently disabled") || m.includes("coming soon"))
    return "Feature Unavailable";
  if (m.includes("unauthorized") || m.includes("session")) return "Session Expired";
  if (m.includes("permission") || m.includes("not allowed") || m.includes("do not have access"))
    return "Not Allowed";
  if (m.includes("not found")) return "Not Found";
  if (m.includes("already exists") || m.includes("already in use")) return "Already Exists";
  if (m.includes("validation") || m.includes("required") || m.includes("invalid") || m.includes("must be"))
    return "Validation Failed";
  if (m.includes("network") || m.includes("failed to fetch")) return "Connection Problem";
  if (m.includes("server") || m.includes("internal")) return "Server Error";

  return "Action Failed";
};

export function useNotification(options: UseNotificationOptions = {}) {
  const { duration = 4000 } = options;
  const { toasts, dismiss } = useGlobalToast();

  const showToast = useCallback(
    (
      message: string,
      variant: "default" | "success" | "destructive" = "default",
      title?: string
    ) => {
      return globalToast({
        title:
          title ||
          (variant === "destructive"
            ? errorTitleFor(message)
            : variant === "success"
              ? "Success"
              : undefined),
        description: message,
        variant,
        duration,
      });
    },
    [duration]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, "success", title),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast(message, "destructive", title),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast(message, "default", title),
    [showToast]
  );

  return {
    toasts,
    showToast,
    success,
    error,
    info,
    removeToast: dismiss,
    clearAll: () => {},
  };
}
