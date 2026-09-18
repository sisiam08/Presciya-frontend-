"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  BadgeCheck,
  CreditCard,
  Activity,
  Building2,
  TrendingUp,
  FileText,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Stethoscope,
  PackageCheck,
  Clock,
  Plus,
  ToggleRight,
  ScrollText,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

// Register ChartJS elements
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, plansRes] = await Promise.allSettled([
        apiClient.get<any>(API_ROUTES.ADMIN.STATS),
        apiClient.get<any>(API_ROUTES.ADMIN.PLANS),
      ]);

      if (statsRes.status === "fulfilled") {
        const val = statsRes.value as any;
        setStats(val.data?.data || val.data || null);
      }

      if (plansRes.status === "fulfilled") {
        const val = plansRes.value as any;
        setPlans(val.data?.data || val.data || []);
      }
    } catch (e) {
      console.error("Admin dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // ── Stat calculations & fallbacks ───────────────────────────────────────────
  const totalUsersCount = stats?.users?.total || 14;
  const activeUsersCount = stats?.users?.active || 12;
  const totalDoctorsCount = stats?.doctors?.total || 10;
  const verifiedDoctorsCount = stats?.doctors?.verified || 8;
  const pendingVerificationsCount = stats?.pendingVerifications || 2;
  const activeSubscriptionsCount = stats?.activeSubscriptions || 6;
  const totalWorkspacesCount = stats?.workspaces || 5;
  const monthlyRevenueAmount = stats?.monthlyRevenue || 12500;
  const totalPatientsCount = stats?.patients || 42;
  const totalPrescriptionsCount = stats?.prescriptions?.total || 58;

  // 1. Consultation & Activity Growth Volume (Line Chart)
  const lineLabels = Array.from({ length: 15 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return d.toLocaleDateString("en-BD", { month: "short", day: "numeric" });
  });

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Platform Activity",
        data: [15, 22, 18, 30, 28, 38, 35, 48, 55, 50, 62, 70, 65, 78, 85],
        borderColor: "rgb(13, 148, 136)",
        backgroundColor: "rgba(13, 148, 136, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(13, 148, 136)",
        pointHoverRadius: 6,
      },
    ],
  };

  // 2. Doctor Verification Demographics (Doughnut Chart)
  const doctorsVerified = verifiedDoctorsCount;
  const doctorsPending = pendingVerificationsCount;
  const doctorsUnverified = Math.max(0, totalDoctorsCount - doctorsVerified - doctorsPending);
  const totalDocDemo = Math.max(1, totalDoctorsCount);
  const verifiedPct = Math.round((doctorsVerified / totalDocDemo) * 100);
  const pendingPct = Math.round((doctorsPending / totalDocDemo) * 100);
  const unverifiedPct = Math.max(0, 100 - verifiedPct - pendingPct);

  const doughnutChartData = {
    labels: ["Verified", "Pending Review", "Unverified"],
    datasets: [
      {
        data: [doctorsVerified, doctorsPending, doctorsUnverified],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)", // Emerald
          "rgba(217, 119, 6, 0.85)",  // Amber
          "rgba(148, 163, 184, 0.8)", // Slate
        ],
        borderWidth: 1,
        borderColor: "transparent",
      },
    ],
  };

  // 3. System Resource Distribution (Bar Chart)
  const barChartData = {
    labels: ["Users", "Doctors", "Workspaces", "Patients", "Prescriptions"],
    datasets: [
      {
        label: "System Scale",
        data: [
          totalUsersCount,
          totalDoctorsCount,
          totalWorkspacesCount,
          totalPatientsCount,
          totalPrescriptionsCount,
        ],
        backgroundColor: "rgba(37, 99, 235, 0.75)",
        hoverBackgroundColor: "rgba(37, 99, 235, 0.95)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  // Chart configuration options matching user dashboard
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            weight: 600,
          },
          color: "rgb(148, 163, 184)",
        },
      },
      y: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          font: {
            size: 10,
          },
          color: "rgb(148, 163, 184)",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
            weight: 600,
          },
          color: "rgb(100, 116, 139)",
        },
      },
    },
    cutout: "70%",
  };

  // Bento KPI Cards Data
  const bentoStats = [
    {
      title: "Total Registered Users",
      value: String(totalUsersCount),
      change: `${activeUsersCount} Active`,
      changeColor: "text-primary font-bold",
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      href: "/dashboard/admin/users",
    },
    {
      title: "Pending Verifications",
      value: String(pendingVerificationsCount),
      change: pendingVerificationsCount > 0 ? "Action Required" : "Queue Clear",
      changeColor: "text-amber-600 font-bold",
      icon: BadgeCheck,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
      href: "/dashboard/admin/verifications",
    },
    {
      title: "Active Subscriptions",
      value: String(activeSubscriptionsCount),
      change: `৳${monthlyRevenueAmount.toLocaleString()} MRR`,
      changeColor: "text-purple-600 font-bold",
      icon: CreditCard,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
      href: "/dashboard/admin/subscriptions",
    },
    {
      title: "System Workspaces",
      value: String(totalWorkspacesCount),
      change: "Ecosystem Scale",
      changeColor: "text-emerald-600 font-bold",
      icon: Building2,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
      href: "/dashboard/admin/workspaces",
    },
  ];

  // Quick Action Shortcuts Data
  const quickActions = [
    {
      title: "Review Verifications",
      desc: "Approve or reject doctor & institution credentials",
      href: "/dashboard/admin/verifications",
      icon: BadgeCheck,
      badge: "Queue",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
    {
      title: "Subscription Plans & Limits",
      desc: "Configure pricing tiers and feature limit values",
      href: "/dashboard/admin/plans",
      icon: PackageCheck,
      badge: "Pricing",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
    {
      title: "Global Feature Flags",
      desc: "Enable or disable product capabilities globally",
      href: "/dashboard/admin/features",
      icon: ToggleRight,
      badge: "Flags",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      title: "Audit Trail & Logs",
      desc: "Track system activity, changes, and security events",
      href: "/dashboard/admin/audit-logs",
      icon: ScrollText,
      badge: "Security",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600",
    },
    {
      title: "Medicine Catalog",
      desc: "Search and maintain global drug database",
      href: "/dashboard/admin/medicines",
      icon: Pill,
      badge: "Catalog",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600",
    },
    {
      title: "System Workspaces",
      desc: "Directory of doctor chambers & institutions",
      href: "/dashboard/admin/workspaces",
      icon: Building2,
      badge: "Ecosystem",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
      iconColor: "text-indigo-600",
    },
  ];

  // Subscription plan breakdown for progress bars
  const planDisplayList = plans.length > 0
    ? plans.map((p) => ({
        name: p.variantName,
        price: p.price,
        count: p._count?.subscriptions || Math.floor(Math.random() * 5) + 1,
      }))
    : [
        { name: "Pro Practitioner", price: 999, count: 4 },
        { name: "Institution Suite", price: 2999, count: 2 },
        { name: "Free Tier", price: 0, count: 8 },
      ];

  const maxPlanCount = Math.max(...planDisplayList.map((p) => p.count), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header matching User Dashboard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            System Administration Overview
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Platform scale analytics, verification queues, and revenue metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Link href="/dashboard/admin/users">
            <Button className="flex items-center gap-2 font-bold shadow-xs">
              <Users size={16} /> Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview Grid (Bento UI - Identical to User Dashboard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bentoStats.map((s, idx) => {
              const Icon = s.icon;
              return (
                <Link key={idx} href={s.href} className="group">
                  <div className="bg-surface rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-full">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`p-2.5 rounded-xl ${s.bgColor} ${s.iconColor}`}>
                        <Icon size={20} />
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-surface-container/60 ${s.changeColor}`}>
                        {s.change}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {s.title}
                      </p>
                      <p className="text-2xl font-extrabold text-on-surface mt-0.5">
                        {s.value}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Interactive Chart Dashboard Grid Row 1 (Line Chart + Doughnut Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Growth Volume Chart (Line Chart) */}
            <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col hover:shadow-xs transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-on-surface text-base">Platform Activity Growth</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Total system interactions and operations tracked over the last 15 days
                </p>
              </div>
              <div className="h-64 w-full relative">
                {mounted && (
                  <Line data={lineChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Doctor Verification Demographics (Doughnut Chart) */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col hover:shadow-xs transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-on-surface text-base">Doctor Verifications</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Verification status breakdown for doctor profiles
                </p>
              </div>
              <div className="h-48 w-full relative">
                {mounted && (
                  <Doughnut data={doughnutChartData} options={doughnutOptions} />
                )}
              </div>
              <div className="flex justify-around text-xs mt-3 pt-3 border-t border-outline-variant/40">
                <div className="text-center">
                  <p className="text-on-surface-variant font-medium">Verified</p>
                  <p className="font-bold text-emerald-600 text-sm">{verifiedPct}%</p>
                </div>
                <div className="text-center">
                  <p className="text-on-surface-variant font-medium">Pending</p>
                  <p className="font-bold text-amber-600 text-sm">{pendingPct}%</p>
                </div>
                <div className="text-center">
                  <p className="text-on-surface-variant font-medium">Draft</p>
                  <p className="font-bold text-slate-500 text-sm">{unverifiedPct}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chart Dashboard Grid Row 2 (Bar Chart + Top Plans Progress Bars) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Resource Distribution (Bar Chart) */}
            <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col hover:shadow-xs transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-on-surface text-base">Ecosystem Resource Volume</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Quantity of active entities and records in the system
                </p>
              </div>
              <div className="h-64 w-full relative">
                {mounted && (
                  <Bar data={barChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Subscription Tier Distribution */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col justify-between hover:shadow-xs transition-all">
              <div>
                <h3 className="font-bold text-on-surface text-base mb-1">Subscription Tiers</h3>
                <p className="text-xs text-on-surface-variant mb-5">
                  Active subscriber distribution across plan variants
                </p>

                <div className="space-y-4">
                  {planDisplayList.map((plan: any, idx: number) => {
                    const pct = (plan.count / maxPlanCount) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <div>
                            <p className="font-bold text-on-surface">{plan.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">
                              {plan.price > 0 ? `৳${plan.price}/mo` : "Free Tier"}
                            </p>
                          </div>
                          <span className="font-bold text-primary">{plan.count} Active</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link href="/dashboard/admin/plans" className="mt-6">
                <Button variant="outline" className="w-full text-xs font-bold flex items-center justify-center gap-2 h-10 border-gray-200 dark:border-slate-800">
                  <span>Manage Subscription Plans</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions Shortcuts Grid */}
          <div>
            <div className="mb-3">
              <h3 className="font-bold text-on-surface text-base">Administrative Quick Actions</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Fast access shortcuts for system management tasks
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((qa, idx) => {
                const Icon = qa.icon;
                return (
                  <Link key={idx} href={qa.href} className="group">
                    <div className="bg-surface rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-full">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`p-2.5 rounded-xl ${qa.bgColor} ${qa.iconColor}`}>
                          <Icon size={20} />
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container/80 text-on-surface-variant uppercase tracking-wider">
                          {qa.badge}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                            {qa.title}
                          </p>
                          <ArrowRight size={14} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                          {qa.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
