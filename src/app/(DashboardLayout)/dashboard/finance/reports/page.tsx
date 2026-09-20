"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useFinanceScope } from "@/hooks/useFinanceScope";
import FinanceScopeBar from "@/components/finance/FinanceScopeBar";
import FeatureGate from "@/components/ui/FeatureGate";
import { FinanceReport } from "@/types";

export default function FinanceReportsPage() {
  return (
    <FeatureGate feature="finance" label="Finance">
      <FinanceReportsContent />
    </FeatureGate>
  );
}

function FinanceReportsContent() {
  const { workspaces, scope, setScope, withScope, can, loading: scopeLoading } = useFinanceScope();
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (scopeLoading || !scope) return;
    if (!can.report) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const range =
        period === "custom" && dateFrom && dateTo
          ? `&dateFrom=${dateFrom}&dateTo=${dateTo}`
          : "";
      const res = await apiClient.get<any>(
        withScope(`${API_ROUTES.FINANCE.REPORTS}?period=${period}${range}`),
      );
      setReport(res.data?.data || res.data);
    } finally {
      setLoading(false);
    }
  }, [scope, scopeLoading, period, dateFrom, dateTo, withScope, can.report]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = report?.summary;
  const hasData = (summary?.transactionCount ?? 0) > 0;

  const cards = [
    { title: "Total Income", value: formatCurrency(summary?.totalIncome ?? 0), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { title: "Total Expense", value: formatCurrency(summary?.totalExpense ?? 0), icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { title: "Net Result", value: formatCurrency(summary?.netResult ?? 0), icon: Wallet, color: (summary?.netResult ?? 0) >= 0 ? "text-primary" : "text-rose-600", bg: "bg-primary/10" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between print:hidden">
        <div>
          <Link
            href="/dashboard/finance"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Finance
          </Link>
          <h1 className="text-2xl font-bold text-on-surface">Finance Reports</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Income, expense and net result for the selected period.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="print:hidden">
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
      </div>

      {!scopeLoading && !can.report ? (
        <div className="rounded-2xl border border-outline-variant bg-surface px-6 py-16 text-center text-sm text-on-surface-variant">
          You do not have permission to view finance reports in this workspace.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : !hasData ? (
        <div className="rounded-2xl border border-outline-variant bg-surface px-6 py-16 text-center">
          <Wallet className="mx-auto mb-3 h-10 w-10 text-on-surface-variant opacity-40" />
          <p className="text-sm font-medium text-on-surface">
            No financial data available for this period.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-xs"
                >
                  <span className={`mb-3 inline-flex rounded-xl p-2.5 ${c.bg} ${c.color}`}>
                    <Icon size={20} />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {c.title}
                  </p>
                  <p className="mt-0.5 text-2xl font-extrabold text-on-surface">
                    {c.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[
              { title: "Income by Category", items: report?.incomeByCategory, color: "text-emerald-600" },
              { title: "Expense by Category", items: report?.expenseByCategory, color: "text-rose-600" },
            ].map((group) => (
              <div
                key={group.title}
                className="overflow-hidden rounded-2xl border border-outline-variant bg-surface"
              >
                <div className="border-b border-outline-variant px-6 py-4">
                  <h3 className="text-base font-bold text-on-surface">
                    {group.title}
                  </h3>
                </div>
                {(group.items?.length || 0) === 0 ? (
                  <p className="px-6 py-6 text-sm text-on-surface-variant">
                    No data for this period.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {group.items!.map((c) => (
                        <tr
                          key={c.categoryId}
                          className="border-t border-outline-variant/40"
                        >
                          <td className="px-6 py-3 text-on-surface">
                            {c.name}
                            <span className="ml-2 text-xs text-on-surface-variant">
                              ({c.count})
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-right font-semibold ${group.color}`}>
                            {formatCurrency(c.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>

          {/* Time series */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
            <div className="border-b border-outline-variant px-6 py-4">
              <h3 className="text-base font-bold text-on-surface">
                Trend ({report?.period?.groupBy})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-xs text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Period</th>
                    <th className="px-6 py-3 text-right font-semibold">Income</th>
                    <th className="px-6 py-3 text-right font-semibold">Expense</th>
                    <th className="px-6 py-3 text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.timeSeries?.map((t) => (
                    <tr key={t.bucket} className="border-t border-outline-variant/40">
                      <td className="px-6 py-3 font-medium text-on-surface">
                        {t.bucket}
                      </td>
                      <td className="px-6 py-3 text-right text-emerald-600">
                        {formatCurrency(t.income)}
                      </td>
                      <td className="px-6 py-3 text-right text-rose-600">
                        {formatCurrency(t.expense)}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-on-surface">
                        {formatCurrency(t.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workspace summary */}
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
        </div>
      )}
    </div>
  );
}
