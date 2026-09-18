"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  FileText,
  Users,
  Building,
  Activity,
  RefreshCw,
  BarChart3,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.ANALYTICS.DASHBOARD);
      setAnalytics(res.data?.data || res.data);
    } catch {
      setAnalytics(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const trend = analytics?.prescriptionsTrend || [];
  const topMeds = analytics?.topMedicines || [];
  const maxTrendVal = Math.max(...trend.map((t: any) => t.count), 1);

  const kpis = [
    {
      title: "Total Prescriptions",
      value: analytics?.summary?.totalPrescriptions ?? 0,
      change: "All Time",
      changeColor: "text-primary font-bold",
      icon: FileText,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Total Patients",
      value: analytics?.summary?.totalPatients ?? 0,
      change: "Active Directory",
      changeColor: "text-teal-600 font-bold",
      icon: Users,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      title: "Total Doctors",
      value: analytics?.summary?.totalDoctors ?? 1,
      change: "Staff",
      changeColor: "text-purple-600 font-bold",
      icon: Activity,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
    {
      title: "Active Chambers",
      value: analytics?.summary?.totalChambers ?? 1,
      change: "Locations",
      changeColor: "text-amber-600 font-bold",
      icon: Building,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-1">Practice performance metrics and trends across chambers.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Overview Grid (Bento UI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="bg-surface rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`p-2.5 rounded-xl ${kpi.bgColor} ${kpi.iconColor}`}>
                      <Icon size={20} />
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-surface-container/60 ${kpi.changeColor}`}>
                      {kpi.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-extrabold text-on-surface mt-0.5">
                      {kpi.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trend + Top Medicines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prescription Trend */}
            <div className="lg:col-span-2 bg-surface rounded-2xl border border-outline-variant p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Prescription Trend (7 Days)</h2>
              </div>

              {trend.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-on-surface-variant italic">
                  No prescription trend data available.
                </div>
              ) : (
                <>
                  <div className="h-56 flex items-end gap-2 border-b border-outline-variant pb-2">
                    {trend.map((item: any, idx: number) => {
                      const pct = Math.max((item.count / maxTrendVal) * 85, 4);
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-1 group/bar"
                          onMouseEnter={() => setHoveredBar(idx)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className="relative w-full rounded-t bg-primary/30 group-hover/bar:bg-primary transition-all duration-300 cursor-pointer"
                            style={{ height: `${pct}%` }}
                          >
                            {hoveredBar === idx && (
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded whitespace-nowrap">
                                {item.count} Rx
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    {trend.map((item: any, idx: number) => (
                      <span key={idx} className="flex-1 text-center text-[10px] font-medium text-on-surface-variant">
                        {new Date(item.date).toLocaleDateString("en-BD", { weekday: "short" })}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Top Medicines */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-6">
              <div className="flex items-center gap-3 mb-6">
                <Pill className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Top Prescribed Medicines</h2>
              </div>

              {topMeds.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant italic">
                  No medicine data yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {topMeds.map((med: any, idx: number) => {
                    const maxCount = topMeds[0]?.prescriptionsCount || 1;
                    const pct = (med.prescriptionsCount / maxCount) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <div>
                            <p className="font-semibold text-on-surface">{med.brandName || "—"}</p>
                            <p className="text-[10px] text-on-surface-variant">{med.generic || "—"}</p>
                          </div>
                          <span className="font-bold text-primary">{med.prescriptionsCount}</span>
                        </div>
                        <div className="h-1.5 w-full bg-outline-variant rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Doctor/Chamber Performance (if institution analytics) */}
          {analytics?.doctorPerformance && analytics.doctorPerformance.length > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Doctor Performance</h2>
              </div>
              <div className="text-sm text-on-surface-variant">
                {analytics.doctorPerformance.length} active doctors tracked across departments.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
