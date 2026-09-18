"use client";

import { useCallback } from "react";
import { toast as globalToast, useToast as useGlobalToast } from "@/components/ui/use-toast";

interface UseNotificationOptions {
  duration?: number;
}

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
        title: title || (variant === "destructive" ? "Error" : variant === "success" ? "Success" : undefined),
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
