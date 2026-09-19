"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X, Search, TrendingDown, TrendingUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, PAYMENT_METHODS } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";
import {
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionType,
  PaymentMethod,
  Workspace,
} from "@/types";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  workspaces: Workspace[];
  defaultWorkspaceId: string;
  initialType?: FinancialTransactionType;
  transaction?: FinancialTransaction | null;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function TransactionDialog({
  open,
  onClose,
  onSaved,
  workspaces,
  defaultWorkspaceId,
  initialType = FinancialTransactionType.INCOME,
  transaction = null,
}: TransactionDialogProps) {
  const { success, error: showError } = useNotification();
  const isEdit = Boolean(transaction);

  const [type, setType] = useState<FinancialTransactionType>(initialType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);

  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Optional patient reference
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientLabel, setPatientLabel] = useState("");

  // Reset / preload when the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setPaymentMethod(transaction.paymentMethod);
      setTransactionDate(transaction.transactionDate.slice(0, 10));
      setDescription(transaction.description || "");
      setNotes(transaction.notes || "");
      setWorkspaceId(transaction.workspaceId);
      setPatientId(transaction.patientId || null);
      setPatientLabel(transaction.patient?.name || "");
    } else {
      setType(initialType);
      setAmount("");
      setCategoryId("");
      setPaymentMethod("CASH");
      setTransactionDate(todayIso());
      setDescription("");
      setNotes("");
      setWorkspaceId(defaultWorkspaceId);
      setPatientId(null);
      setPatientLabel("");
    }
    setPatientQuery("");
    setPatientResults([]);
  }, [open, transaction, initialType, defaultWorkspaceId]);

  // Load categories for the selected type.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingCategories(true);
    apiClient
      .get<any>(`${API_ROUTES.FINANCE.CATEGORIES}?type=${type}`)
      .then((res) => {
        if (!active) return;
        const list: FinancialCategory[] = res.data?.data || res.data || [];
        setCategories(list);
        // Keep the current category if it still matches, else pick the first.
        setCategoryId((prev) =>
          list.some((c) => c.id === prev) ? prev : list[0]?.id || "",
        );
      })
      .catch(() => active && setCategories([]))
      .finally(() => active && setLoadingCategories(false));
    return () => {
      active = false;
    };
  }, [open, type]);

  // Patient search (debounced).
  useEffect(() => {
    if (!patientOpen) return;
    const handle = setTimeout(() => {
      apiClient
        .get<any>(
          `${API_ROUTES.PATIENTS.SEARCH}?q=${encodeURIComponent(patientQuery)}&limit=6`,
        )
        .then((res) => setPatientResults(res.data?.data || res.data || []))
        .catch(() => setPatientResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [patientQuery, patientOpen]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      return showError("Enter an amount greater than 0");
    }
    if (!categoryId) {
      return showError("Select a category");
    }
    if (!workspaceId) {
      return showError("Select a workspace");
    }

    // Guard against duplicate submissions before the saving state re-renders.
    if (savingRef.current) return;
    savingRef.current = true;

    setSaving(true);
    try {
      const payload = {
        type,
        amount,
        categoryId,
        paymentMethod,
        transactionDate,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        patientId: patientId || undefined,
        workspaceId,
      };

      if (isEdit && transaction) {
        await apiClient.patch(API_ROUTES.FINANCE.TRANSACTION(transaction.id), {
          type,
          amount,
          categoryId,
          paymentMethod,
          transactionDate,
          description: description.trim() || null,
          notes: notes.trim() || null,
          patientId: patientId || null,
        });
        success("Transaction updated");
      } else {
        await apiClient.post(API_ROUTES.FINANCE.TRANSACTIONS, payload);
        success(type === FinancialTransactionType.INCOME ? "Income recorded" : "Expense recorded");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to save transaction");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h2 className="text-base font-bold text-on-surface">
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: FinancialTransactionType.INCOME, label: "Income", icon: TrendingUp },
              { value: FinancialTransactionType.EXPENSE, label: "Expense", icon: TrendingDown },
            ].map((opt) => {
              const Icon = opt.icon;
              const selected = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                    selected
                      ? opt.value === FinancialTransactionType.INCOME
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  <Icon size={16} /> {opt.label}
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Amount (৳) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Category + payment method */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {loadingCategories && <option>Loading…</option>}
                {!loadingCategories && categories.length === 0 && (
                  <option value="">No categories available</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + workspace */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Date *
              </label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Workspace *
              </label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                disabled={isEdit}
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional patient */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Patient (optional)
            </label>
            {patientId ? (
              <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container/40 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> {patientLabel}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPatientId(null);
                    setPatientLabel("");
                  }}
                  className="text-xs font-semibold text-primary"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <Input
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    onFocus={() => setPatientOpen(true)}
                    placeholder="Search patient by name or phone…"
                    className="pl-9"
                  />
                </div>
                {patientOpen && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-outline-variant bg-surface shadow-xl">
                    {patientResults.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-on-surface-variant">
                        No patients found.
                      </p>
                    ) : (
                      patientResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientLabel(p.name);
                            setPatientOpen(false);
                          }}
                          className="w-full border-b border-outline-variant/30 px-4 py-2 text-left text-sm text-on-surface last:border-0 hover:bg-surface-container"
                        >
                          {p.name}
                          <span className="ml-2 text-xs text-on-surface-variant">
                            {p.phone || ""}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Patient consultation"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Notes
            </label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>

          {selectedCategory && (
            <p className="text-[11px] text-on-surface-variant">
              This will be recorded as a{" "}
              <span className="font-semibold">{type.toLowerCase()}</span> under{" "}
              <span className="font-semibold">{selectedCategory.name}</span>.
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-outline-variant px-6 py-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Transaction"}
          </Button>
        </div>
      </div>
    </div>
  );
}
