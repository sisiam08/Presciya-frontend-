"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  const variant = state?.variant ?? "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state?.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => settle(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            /* `max-h` + scroll so a long message can never push the dialog
               beyond a short (landscape phone) viewport. */
            className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                  variant === "danger"
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-on-surface">
                  {state.title}
                </h2>
                {state.description && (
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {state.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => settle(false)}>
                {state.cancelLabel || "Cancel"}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={() => settle(true)}
                autoFocus
              >
                {state.confirmLabel || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
