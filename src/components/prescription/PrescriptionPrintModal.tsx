"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Printer, Loader2, X, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface PrescriptionPrintModalProps {
  prescriptionId: string;
  status?: string;
  onClose: () => void;
}

/**
 * Renders the backend's canonical A4 layout in an iframe so browser preview and
 * print share a single renderer (Section 14.4). Draft prescriptions can be
 * previewed but not printed/downloaded (Section 13.3).
 */
export default function PrescriptionPrintModal({
  prescriptionId,
  status,
  onClose,
}: PrescriptionPrintModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFinalized = status === "FINALIZED";

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<string>(
          API_ROUTES.PRESCRIPTIONS.PREVIEW(prescriptionId),
          { responseType: "text" },
        );
        if (active) setHtml(res.data);
      } catch (e: any) {
        if (active)
          setError(
            e?.response?.data?.message || "Failed to load prescription preview.",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [prescriptionId]);

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container/50 p-4">
          <h2 className="text-base font-bold text-on-surface">
            Prescription Preview
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!html || !isFinalized}
              title={
                isFinalized
                  ? "Print or save as PDF"
                  : "Finalize the prescription before printing"
              }
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isFinalized && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            This is a draft. Finalize the prescription to enable printing and
            download.
          </div>
        )}

        <div className="relative flex-1 bg-slate-100 dark:bg-slate-900">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Rendering prescription…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold text-error">
              {error}
            </div>
          )}
          {html && (
            <iframe
              ref={iframeRef}
              title="Prescription preview"
              srcDoc={html}
              sandbox="allow-same-origin allow-modals"
              className="h-full w-full border-0"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
