"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useNotification } from "@/hooks/useNotification";
import { Appointment } from "@/types";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  workspaceId: string;
  appointment: Appointment | null;
  /** Whether the caller may apply discounts / free consultations. */
  canDiscount: boolean;
}

export default function AppointmentPaymentDialog({
  open,
  onClose,
  onSaved,
  workspaceId,
  appointment,
  canDiscount,
}: PaymentDialogProps) {
  const { success, error: showError } = useNotification();
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [markFree, setMarkFree] = useState(false);
  const [saving, setSaving] = useState(false);

  const visitingFee = Number(appointment?.visitingFee ?? 0);

  useEffect(() => {
    if (!open || !appointment) return;
    setDiscount(String(Number(appointment.discount ?? 0) || ""));
    setPaidAmount("");
    setPaymentMethod(appointment.paymentMethod || "CASH");
    setMarkFree(false);
  }, [open, appointment]);

  const payable = useMemo(() => {
    const d = Math.min(Math.max(Number(discount) || 0, 0), visitingFee);
    return Math.max(0, Math.round((visitingFee - d) * 100) / 100);
  }, [discount, visitingFee]);

  const handleSave = async () => {
    if (!appointment || !workspaceId) return;
    setSaving(true);
    try {
      await apiClient.post(
        API_ROUTES.APPOINTMENTS.RECORD_PAYMENT(workspaceId, appointment.id),
        {
          ...(discount !== "" ? { discount } : {}),
          ...(markFree ? { markFree: true } : {}),
          ...(!markFree && paidAmount !== "" ? { paidAmount } : {}),
          ...(!markFree ? { paymentMethod } : {}),
        },
      );
      success(markFree || payable === 0 ? "Marked as free" : "Payment recorded");
      onSaved();
      onClose();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-on-surface">
            <Wallet className="h-4 w-4 text-primary" /> Collect Payment
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-surface-container/50 p-3 text-sm">
          <p className="font-semibold text-on-surface">
            {appointment.patient?.name || "Patient"} · Serial #
            {appointment.serialNumber ?? appointment.serialNo}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Visiting Fee</span>
            <span className="font-semibold text-on-surface">
              {formatCurrency(visitingFee)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Discount</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={!canDiscount || markFree}
              className="h-9 w-32 text-right"
              placeholder="0"
            />
          </div>

          <div className="flex items-center justify-between border-t border-outline-variant pt-3">
            <span className="font-semibold text-on-surface">Payable</span>
            <span className="text-lg font-extrabold text-primary">
              {formatCurrency(payable)}
            </span>
          </div>

          {!markFree && payable > 0 && (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-on-surface-variant">Amount Received</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="h-9 w-32 text-right"
                  placeholder={String(payable)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {canDiscount && (
            <label className="flex items-center gap-2 pt-1 text-xs font-medium text-on-surface-variant">
              <input
                type="checkbox"
                checked={markFree}
                onChange={(e) => setMarkFree(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              Mark as free consultation (no payment)
            </label>
          )}

          {!canDiscount && (
            <p className="text-[11px] text-on-surface-variant">
              You can record the full payment but not apply discounts.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : markFree || payable === 0 ? "Mark Free" : "Record Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
