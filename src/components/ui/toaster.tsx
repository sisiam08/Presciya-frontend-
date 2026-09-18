// src/components/ui/toaster.tsx
"use client";

import { useToast } from "./use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    // The wrapper must not capture pointer events when empty, otherwise it
    // overlays and blocks clicks on buttons in the bottom-right area (e.g.
    // modal Save/Book buttons). Only the toast cards themselves are clickable.
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            t.variant === "destructive"
              ? "bg-error-container text-on-error-container border-error/30"
              : t.variant === "success"
                ? "bg-secondary-container text-on-secondary-container border-secondary/30"
                : "bg-surface-container-lowest text-on-surface border-outline-variant"
          }`}
        >
          <div className="flex-1 pr-2">
            {t.title && <h4 className="font-semibold text-sm">{t.title}</h4>}
            {t.description && (
              <p className="text-xs mt-1 opacity-90">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="p-0.5 rounded-full hover:bg-on-surface/10 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
