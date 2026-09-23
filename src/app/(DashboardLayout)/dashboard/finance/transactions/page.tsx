"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";
import { useNotification } from "@/hooks/useNotification";
import { useFinanceScope } from "@/hooks/useFinanceScope";
import FinanceScopeBar from "@/components/finance/FinanceScopeBar";
import TransactionDialog from "@/components/finance/TransactionDialog";
import FeatureGate from "@/components/ui/FeatureGate";
import {
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionType,
} from "@/types";

const PAGE_LIMIT = 20;

const paymentLabel = (value: string) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label || value;

export default function FinanceTransactionsPage() {
  return (
    <FeatureGate feature="finance" label="Finance">
      <FinanceTransactionsContent />
    </FeatureGate>
  );
}

function FinanceTransactionsContent() {
  const { workspaces, scope, setScope, withScope, can, loading: scopeLoading } = useFinanceScope();
  const { success, error: showError } = useNotification();
  const confirm = useConfirm();

  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [details, setDetails] = useState<FinancialTransaction | null>(null);

  // Categories for the filter dropdown.
  useEffect(() => {
    apiClient
      .get<any>(API_ROUTES.FINANCE.CATEGORIES)
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_LIMIT));
    if (typeFilter) params.set("type", typeFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (methodFilter) params.set("paymentMethod", methodFilter);
    if (search.trim()) params.set("search", search.trim());
    params.set("period", period);
    if (period === "custom") {
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
    }
    return params.toString();
  }, [page, typeFilter, categoryFilter, methodFilter, search, period, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (scopeLoading || !scope) return;
    setLoading(true);
    try {
      const res = await apiClient.get<any>(
        withScope(`${API_ROUTES.FINANCE.TRANSACTIONS}?${buildQuery()}`),
      );
      setTransactions(res.data?.data || res.data || []);
      setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeLoading, buildQuery, withScope]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [typeFilter, categoryFilter, methodFilter, search, period, dateFrom, dateTo]);

  const handleDelete = async (tx: FinancialTransaction) => {
    const ok = await confirm({
      title: "Delete this transaction?",
      description:
        "This action cannot be undone. The transaction will be removed from your finance records and the deletion is logged.",
      confirmLabel: "Delete transaction",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.delete(API_ROUTES.FINANCE.TRANSACTION(tx.id));
      success("Transaction deleted");
      load();
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to delete transaction");
    }
  };

  const openEdit = (tx: FinancialTransaction) => {
    setEditing(tx);
    setDialogOpen(true);
  };

  const showWorkspaceColumn = scope === "all";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/dashboard/finance"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Finance
          </Link>
          <h1 className="text-2xl font-bold text-on-surface">Transactions</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Search, filter and review recorded income and expenses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <FinanceScopeBar
        workspaces={workspaces}
        scope={scope}
        onScopeChange={setScope}
        period={period}
        onPeriodChange={setPeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, notes or category…"
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
        >
          <option value="">All Methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-on-surface">
              No financial transactions yet.
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Income is recorded automatically when appointment payments are
              collected.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface-container text-xs text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Method</th>
                  {showWorkspaceColumn && (
                    <th className="px-4 py-3 text-left font-semibold">Workspace</th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold">Created By</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-outline-variant/40 hover:bg-surface-container/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          tx.type === FinancialTransactionType.INCOME
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                        }`}
                      >
                        {tx.type === FinancialTransactionType.INCOME ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface">
                      {tx.category?.name || "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-on-surface-variant">
                      {tx.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {paymentLabel(tx.paymentMethod)}
                    </td>
                    {showWorkspaceColumn && (
                      <td className="px-4 py-3 text-on-surface-variant">
                        {tx.workspace?.name || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-on-surface-variant">
                      {tx.createdBy?.name || "—"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-bold ${
                        tx.type === FinancialTransactionType.INCOME
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {tx.type === FinancialTransactionType.INCOME ? "+" : "−"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetails(tx)}
                          title="View"
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                        >
                          <Eye size={14} />
                        </button>
                        {can.update && (
                          <button
                            onClick={() => openEdit(tx)}
                            title="Edit"
                            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {can.delete && (
                          <button
                            onClick={() => handleDelete(tx)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant px-6 py-3 text-xs text-on-surface-variant">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} transaction
              {meta.total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {details && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetails(null)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">
                Transaction Details
              </h2>
              <button
                onClick={() => setDetails(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Type</span>
                <span className="font-semibold text-on-surface">
                  {details.type === FinancialTransactionType.INCOME
                    ? "Income"
                    : "Expense"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Amount</span>
                <span
                  className={`font-bold ${
                    details.type === FinancialTransactionType.INCOME
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {formatCurrency(details.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Category</span>
                <span className="font-medium text-on-surface">
                  {details.category?.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Payment Method</span>
                <span className="font-medium text-on-surface">
                  {paymentLabel(details.paymentMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Date</span>
                <span className="font-medium text-on-surface">
                  {formatDate(details.transactionDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Workspace</span>
                <span className="font-medium text-on-surface">
                  {details.workspace?.name || "—"}
                </span>
              </div>
              {details.patient?.name && (
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Patient</span>
                  <span className="font-medium text-on-surface">
                    {details.patient.name}
                  </span>
                </div>
              )}
              {details.description && (
                <div>
                  <p className="text-on-surface-variant">Description</p>
                  <p className="mt-0.5 text-on-surface">{details.description}</p>
                </div>
              )}
              {details.notes && (
                <div>
                  <p className="text-on-surface-variant">Notes</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-on-surface">
                    {details.notes}
                  </p>
                </div>
              )}
              <div className="border-t border-outline-variant pt-3 text-[11px] text-on-surface-variant">
                <p>Created by {details.createdBy?.name || "—"}</p>
                <p>Created {formatDateTime(details.createdAt)}</p>
                <p>Updated {formatDateTime(details.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        workspaces={workspaces}
        defaultWorkspaceId={
          scope === "all" ? workspaces[0]?.id || "" : scope
        }
        transaction={editing}
      />
    </div>
  );
}
