"use client";

import React from "react";
import { Building2, CalendarDays } from "lucide-react";
import { FINANCE_PERIODS } from "@/lib/constants";
import { Workspace } from "@/types";

interface FinanceScopeBarProps {
  workspaces: Workspace[];
  scope: string;
  onScopeChange: (value: string) => void;
  period?: string;
  onPeriodChange?: (value: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  showPeriod?: boolean;
}

const selectClass =
  "h-10 rounded-lg border border-outline-variant bg-surface px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";

export default function FinanceScopeBar({
  workspaces,
  scope,
  onScopeChange,
  period,
  onPeriodChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showPeriod = true,
}: FinanceScopeBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <select
          value={scope}
          onChange={(e) => onScopeChange(e.target.value)}
          className={`${selectClass} min-w-[180px]`}
        >
          <option value="all">All Workspaces</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      {showPeriod && onPeriodChange && (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className={selectClass}
          >
            {FINANCE_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPeriod && period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom || ""}
            onChange={(e) => onDateFromChange?.(e.target.value)}
            className={selectClass}
          />
          <span className="text-xs text-on-surface-variant">to</span>
          <input
            type="date"
            value={dateTo || ""}
            onChange={(e) => onDateToChange?.(e.target.value)}
            className={selectClass}
          />
        </div>
      )}
    </div>
  );
}
