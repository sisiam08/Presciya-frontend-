"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, TrendingUp, RefreshCw, ScrollText, Building2, PackageCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<any>(null);
  const [subLogs, setSubLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        apiClient.get<any>(API_ROUTES.ADMIN.STATS),
        apiClient.get<any>(`${API_ROUTES.ADMIN.AUDIT_LOGS}?entityType=SUBSCRIPTION&limit=20`)
      ]);
      setStats(statsRes.data?.data || statsRes.data);
      setSubLogs(logsRes.data?.data?.items || logsRes.data?.items || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = {
    labels: ["Active Subs", "Institutions", "Total Workspaces", "Monthly Revenue (৳)"],
    datasets: [
      {
        label: "Metrics & Revenue",
        data: [
          stats?.activeSubscriptions || 0,
          stats?.institutions || 0,
          stats?.workspaces || 0,
          stats?.monthlyRevenue || 0,
        ],
        borderColor: "#9333ea",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#9333ea",
        pointRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: "rgba(226, 232, 240, 0.5)" } },
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Subscription & Revenue Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor active billing, monthly recurring revenue (MRR), and tier updates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Bento KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats?.activeSubscriptions ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Subscriptions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ৳{stats?.monthlyRevenue != null ? stats.monthlyRevenue.toLocaleString() : "0"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monthly Revenue (BDT)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats?.institutions ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Institution Workspaces</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-4 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats?.workspaces ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Workspaces</p>
          </div>
        </div>
      </div>

      {/* Revenue Trend Visual Diagram */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Monetization & Active Subscriber Volume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of active billing tiers and monthly collection
            </p>
          </div>
        </div>

        <div className="h-56 w-full">
          {loading ? <Skeleton className="h-full w-full" /> : <Line data={chartData} options={chartOptions} />}
        </div>
      </div>

      {/* Recent Subscription Changes Audit Trail */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Subscription Audit Trail</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : subLogs.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500 dark:text-slate-400">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            No recent subscription events logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {["Timestamp", "User Account", "Workspace", "Event Action", "Update Details"].map((h) => (
                    <th key={h} className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{log.user?.name || "System"}</p>
                      <p className="text-[10px] text-slate-400">{log.user?.email || "—"}</p>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 font-medium">{log.workspace?.name || "Global / System"}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 max-w-xs truncate font-mono">
                      {log.newValues ? JSON.stringify(log.newValues) : "Subscription updated"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
