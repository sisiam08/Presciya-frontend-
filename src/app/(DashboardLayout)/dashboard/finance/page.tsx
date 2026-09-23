"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  RefreshCw,
  FileBarChart,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useFinanceScope } from "@/hooks/useFinanceScope";
import FinanceScopeBar from "@/components/finance/FinanceScopeBar";
import FeatureGate from "@/components/ui/FeatureGate";
import {
  FinanceReport,
  FinancialTransaction,
  FinancialTransactionType,
} from "@/types";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const INCOME_COLOR = "#059669";
const EXPENSE_COLOR = "#dc2626";
const CATEGORY_PALETTE = [
  "#0f8374",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#65a30d",
  "#9333ea",
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function FinanceDashboardPage() {
  return (
    <FeatureGate feature="finance" label="Finance">
      <FinanceDashboardContent />
    </FeatureGate>
  );
}

function FinanceDashboardContent() {
  const { workspaces, scope, setScope, withScope, loading: scopeLoading } = useFinanceScope();
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [recent, setRecent] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const periodQuery = () => {
    const base = `period=${period}`;
    const range =
      period === "custom" && dateFrom && dateTo
        ? `&dateFrom=${dateFrom}&dateTo=${dateTo}`
        : "";
    return base + range;
  };

  const load = useCallback(async () => {
    if (scopeLoading || !scope) return;
    setLoading(true);
    try {
      const [reportRes, txRes] = await Promise.allSettled([
        apiClient.get<any>(
          withScope(`${API_ROUTES.FINANCE.REPORTS}?${periodQuery()}`),
        ),
        apiClient.get<any>(
          // Recent transactions must honour the SAME scope + period as the
          // statistics above, otherwise the list and the totals disagree.
          withScope(
            `${API_ROUTES.FINANCE.TRANSACTIONS}?limit=5&page=1&${periodQuery()}`,
          ),
        ),
      ]);
      if (reportRes.status === "fulfilled") {
        setReport(reportRes.value.data?.data || reportRes.value.data);
      }
      if (txRes.status === "fulfilled") {
        setRecent(txRes.value.data?.data || txRes.value.data || []);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeLoading, period, dateFrom, dateTo, withScope]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    load();
  }, [load]);

  const summary = report?.summary;
  const timeSeries = report?.timeSeries || [];
  const hasData = (summary?.transactionCount ?? 0) > 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "rgb(148,163,184)" },
      },
      y: {
        grid: { color: "rgba(148,163,184,0.12)" },
        ticks: { font: { size: 10 }, color: "rgb(148,163,184)" },
      },
    },
  };

  const barData = {
    labels: timeSeries.map((t) => t.bucket),
    datasets: [
      {
        label: "Income",
        data: timeSeries.map((t) => t.income),
        backgroundColor: "rgba(5,150,105,0.75)",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Expense",
        data: timeSeries.map((t) => t.expense),
        backgroundColor: "rgba(220,38,38,0.7)",
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxWidth: 10, font: { size: 10 }, color: "rgb(100,116,139)" },
      },
    },
  };

  const categoryChart = (
    items: { name: string; total: number }[] | undefined,
    color: string,
  ) => ({
    labels: (items || []).map((c) => c.name),
    datasets: [
      {
        data: (items || []).map((c) => c.total),
        backgroundColor:
          (items || []).length === 1
            ? [color]
            : CATEGORY_PALETTE.slice(0, (items || []).length),
        borderWidth: 1,
        borderColor: "transparent",
      },
    ],
  });

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(summary?.totalIncome ?? 0),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Total Expense",
      value: formatCurrency(summary?.totalExpense ?? 0),
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      title: "Net Result",
      value: formatCurrency(summary?.netResult ?? 0),
      icon: Wallet,
      color:
        (summary?.netResult ?? 0) >= 0 ? "text-primary" : "text-rose-600",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Finance</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Review your business income and expenses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { href: "/dashboard/finance/transactions", label: "Transactions", icon: Receipt },
          { href: "/dashboard/finance/reports", label: "Reports", icon: FileBarChart },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface px-5 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {l.label}
              </span>
              <ArrowRight className="h-4 w-4 text-on-surface-variant" />
            </Link>
          );
        })}
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

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="flex flex-col justify-between rounded-2xl border border-outline-variant bg-surface p-5 shadow-xs"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className={`rounded-xl p-2.5 ${c.bg} ${c.color}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {c.title}
                    </p>
                    <p className="mt-0.5 text-2xl font-extrabold text-on-surface">
                      {c.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!hasData ? (
            <div className="rounded-2xl border border-outline-variant bg-surface px-6 py-16 text-center">
              <Wallet className="mx-auto mb-3 h-10 w-10 text-on-surface-variant opacity-40" />
              <p className="text-sm font-medium text-on-surface">
                No financial transactions yet.
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Income is recorded automatically when appointment payments are
                collected.
              </p>
            </div>
          ) : (
            <>
              {/* Income vs Expense over time */}
              <div className="rounded-2xl border border-outline-variant bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      Income vs Expense
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Grouped by {report?.period?.groupBy || "period"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: INCOME_COLOR }} />
                      Income
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXPENSE_COLOR }} />
                      Expense
                    </span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  {mounted && timeSeries.length > 0 ? (
                    <Bar data={barData} options={chartOptions} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                      No financial data available for this period.
                    </div>
                  )}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant bg-surface p-6">
                  <h3 className="mb-4 text-base font-bold text-on-surface">
                    Income by Category
                  </h3>
                  {(report?.incomeByCategory?.length || 0) === 0 ? (
                    <div className="flex h-56 items-center justify-center text-sm text-on-surface-variant">
                      No income in this period.
                    </div>
                  ) : (
                    <div className="h-56">
                      {mounted && (
                        <Doughnut
                          data={categoryChart(report?.incomeByCategory, INCOME_COLOR)}
                          options={doughnutOptions}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-outline-variant bg-surface p-6">
                  <h3 className="mb-4 text-base font-bold text-on-surface">
                    Expense by Category
                  </h3>
                  {(report?.expenseByCategory?.length || 0) === 0 ? (
                    <div className="flex h-56 items-center justify-center text-sm text-on-surface-variant">
                      No expense in this period.
                    </div>
                  ) : (
                    <div className="h-56">
                      {mounted && (
                        <Doughnut
                          data={categoryChart(report?.expenseByCategory, EXPENSE_COLOR)}
                          options={doughnutOptions}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace summary (all workspaces) */}
              {scope === "all" && (report?.workspaceSummary?.length || 0) > 0 && (
                <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
                  <div className="border-b border-outline-variant px-6 py-4">
                    <h3 className="text-base font-bold text-on-surface">
                      Workspace Summary
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container text-xs text-on-surface-variant">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold">Workspace</th>
                          <th className="px-6 py-3 text-right font-semibold">Income</th>
                          <th className="px-6 py-3 text-right font-semibold">Expense</th>
                          <th className="px-6 py-3 text-right font-semibold">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report!.workspaceSummary.map((w) => (
                          <tr key={w.workspaceId} className="border-t border-outline-variant/40">
                            <td className="px-6 py-3 font-medium text-on-surface">
                              {w.workspaceName}
                            </td>
                            <td className="px-6 py-3 text-right text-emerald-600">
                              {formatCurrency(w.income)}
                            </td>
                            <td className="px-6 py-3 text-right text-rose-600">
                              {formatCurrency(w.expense)}
                            </td>
                            <td className="px-6 py-3 text-right font-semibold text-on-surface">
                              {formatCurrency(w.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recent transactions */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <h3 className="text-base font-bold text-on-surface">
                Recent Transactions
              </h3>
              <Link
                href="/dashboard/finance/transactions"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-on-surface-variant">
                No financial transactions yet.
              </p>
            ) : (
              <div className="divide-y divide-outline-variant/40">
                {recent.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-on-surface">
                        {tx.description || tx.category?.name || "Transaction"}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {formatDate(tx.transactionDate)} ·{" "}
                        {tx.category?.name}
                        {scope === "all" && tx.workspace?.name
                          ? ` · ${tx.workspace.name}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`ml-4 flex-shrink-0 text-sm font-bold ${
                        tx.type === FinancialTransactionType.INCOME
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {tx.type === FinancialTransactionType.INCOME ? "+" : "−"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
