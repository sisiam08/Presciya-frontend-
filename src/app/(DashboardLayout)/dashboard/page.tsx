"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Calendar,
  Plus,
  ArrowRight,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle,
  Stethoscope,
  TrendingUp,
  Award,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import VerificationNotice from "@/components/verification/VerificationNotice";

// Import and register Chart.js components
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadData = async (targetWsId?: string | null) => {
    setLoading(true);
    try {
      const activeWs = targetWsId || (typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : null);
      
      const [analyticsRes, apptsRes, financeRes] = await Promise.allSettled([
        apiClient.get<any>(API_ROUTES.ANALYTICS.DASHBOARD),
        activeWs 
          ? apiClient.get<any>(API_ROUTES.APPOINTMENTS.LIST(activeWs))
          : Promise.resolve({ data: { data: [] } }),
        apiClient.get<any>(`${API_ROUTES.FINANCE.SUMMARY}?period=month`),
      ]);

      if (analyticsRes.status === "fulfilled") {
        const val = analyticsRes.value as any;
        setAnalytics(val.data?.data || val.data || null);
      }
      if (financeRes.status === "fulfilled") {
        const val = financeRes.value as any;
        setFinanceSummary(val.data?.data || val.data || null);
      }
      if (apptsRes.status === "fulfilled") {
        const val = apptsRes.value as any;
        // Appointment list returns { items, meta }; normalize to an array.
        const payload = val.data?.data ?? val.data;
        const items = Array.isArray(payload) ? payload : payload?.items ?? [];
        setAppointments(
          items.map((a: any) => ({
            ...a,
            scheduledDate: a.scheduledDate ?? a.appointmentDate,
          })),
        );
      }
    } catch (e) {
      console.error("Dashboard load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const wsId = localStorage.getItem("activeWorkspaceId");
    setWorkspaceId(wsId);
    
    // Load immediately
    loadData(wsId);

    // Watch activeWorkspaceId initialization from sidebar (re-fetch if it changes or initializes)
    const checkInterval = setInterval(() => {
      const currentWsId = localStorage.getItem("activeWorkspaceId");
      if (currentWsId && currentWsId !== wsId) {
        setWorkspaceId(currentWsId);
        loadData(currentWsId);
        clearInterval(checkInterval);
      }
    }, 800);

    return () => clearInterval(checkInterval);
  }, []);

  const todayAppts = appointments.filter(
    (a) => new Date(a.scheduledDate).toDateString() === new Date().toDateString()
  );

  // Real metrics only — never fabricate counts when the workspace is empty.
  const totalPrescriptionsCount = analytics?.summary?.totalPrescriptions ?? 0;
  const totalPatientsCount = analytics?.summary?.totalPatients ?? 0;
  const activeChambersCount = analytics?.summary?.totalChambers ?? 0;

  // 1. Weekly Prescriptions Trend Data (Bar Chart)
  const rawTrend = analytics?.prescriptionsTrend || [];
  const trendLabels = rawTrend.length > 0 
    ? rawTrend.map((t: any) => new Date(t.date).toLocaleDateString("en-BD", { weekday: "short" }))
    : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const trendValues = rawTrend.length > 0 
    ? rawTrend.map((t: any) => t.count)
    : Array.from({ length: 7 }).map(() => 0);

  const barChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Prescriptions",
        data: trendValues,
        backgroundColor: "rgba(37, 99, 235, 0.75)",
        hoverBackgroundColor: "rgba(37, 99, 235, 0.95)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  // 2. 15-Day Consultation Volume Data (Line Chart)
  const rawLineTrend = analytics?.lineTrend || [];
  const lineLabels = rawLineTrend.length > 0
    ? rawLineTrend.map((t: any) => new Date(t.date).toLocaleDateString("en-BD", { month: "short", day: "numeric" }))
    : Array.from({ length: 15 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d.toLocaleDateString("en-BD", { month: "short", day: "numeric" });
      });
  const lineValues = rawLineTrend.length > 0
    ? rawLineTrend.map((t: any) => t.count)
    : Array.from({ length: 15 }).map(() => 0);

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Consultations",
        data: lineValues,
        borderColor: "rgb(13, 148, 136)",
        backgroundColor: "rgba(13, 148, 136, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(13, 148, 136)",
        pointHoverRadius: 6,
      },
    ],
  };

  // 3. Patient Gender distribution (Doughnut Chart)
  const malePatients = analytics?.demographics?.male ?? 0;
  const femalePatients = analytics?.demographics?.female ?? 0;
  const totalDemographics = malePatients + femalePatients;
  const malePct = totalDemographics > 0 ? Math.round((malePatients / totalDemographics) * 100) : 0;
  const femalePct = totalDemographics > 0 ? Math.round((femalePatients / totalDemographics) * 100) : 0;

  const doughnutChartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        data: [malePatients, femalePatients],
        backgroundColor: [
          "rgba(37, 99, 235, 0.8)",
          "rgba(124, 58, 237, 0.8)",
        ],
        borderWidth: 1,
        borderColor: "transparent",
      },
    ],
  };

  // 4. Top prescribed medicines list (real data only)
  const topMeds = analytics?.topMedicines ?? [];

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
            weight: "bold" as const,
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
            weight: "bold" as const,
          },
          color: "rgb(100, 116, 139)",
        },
      },
    },
    cutout: "70%",
  };

  const stats = [
    {
      title: "Total Prescriptions",
      value: String(totalPrescriptionsCount),
      change: "All Time",
      changeColor: "text-primary font-bold",
      icon: FileText,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Active Patients",
      value: String(totalPatientsCount),
      change: "Directory",
      changeColor: "text-emerald-600 font-bold",
      icon: Users,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      title: "Appointments Today",
      value: String(todayAppts.length),
      change: "Active Queue",
      changeColor: "text-amber-600 font-bold",
      icon: Calendar,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
    {
      title: "Active Chambers",
      value: String(activeChambersCount),
      change: "Locations",
      changeColor: "text-purple-600 font-bold",
      icon: Stethoscope,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            Welcome back, {user?.name || "Doctor"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Overview of your clinical progress, patient analytics, and queues.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Link href="/dashboard/prescriptions">
            <Button className="flex items-center gap-2">
              <Plus size={16} /> New Prescription
            </Button>
          </Link>
        </div>
      </div>

      <VerificationNotice />

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
          {/* Stats Overview Grid (Bento UI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="bg-surface rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between"
                >
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
              );
            })}
          </div>

          {/* Financial Overview (compact) */}
          <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Wallet size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Financial Overview
                </h3>
                <p className="text-xs text-on-surface-variant">This month</p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-4 sm:justify-items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Income
                </p>
                <p className="text-lg font-extrabold text-emerald-600">
                  {formatCurrency(financeSummary?.totalIncome ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Expense
                </p>
                <p className="text-lg font-extrabold text-rose-600">
                  {formatCurrency(financeSummary?.totalExpense ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Net Result
                </p>
                <p className="text-lg font-extrabold text-on-surface">
                  {formatCurrency(financeSummary?.netResult ?? 0)}
                </p>
              </div>
            </div>
            <Link href="/dashboard/finance">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                View Finance <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Interactive Chart Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Consultation Growth Chart (Line Chart) */}
            <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col hover:shadow-xs transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-on-surface text-base">Consultation Growth Volume</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Total patient consultations tracked over the last 15 days
                </p>
              </div>
              <div className="h-64 w-full relative">
                {mounted && (
                  <Line data={lineChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Patient Gender Distribution (Doughnut Chart) */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col hover:shadow-xs transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-on-surface text-base">Patient Demographics</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Gender distribution across your patient records
                </p>
              </div>
              <div className="h-48 w-full relative">
                {mounted && (
                  <Doughnut data={doughnutChartData} options={doughnutOptions} />
                )}
              </div>
              <div className="flex justify-around text-xs mt-3 pt-3 border-t border-outline-variant/40">
                <div className="text-center">
                  <p className="text-on-surface-variant font-medium">Male</p>
                  <p className="font-bold text-primary text-sm">{malePct}%</p>
                </div>
                <div className="text-center">
                  <p className="text-on-surface-variant font-medium">Female</p>
                  <p className="font-bold text-purple-600 text-sm">{femalePct}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Prescriptions Trend (Bar Chart) */}
            <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col hover:shadow-xs transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-on-surface text-base">Weekly Prescription Issuance</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Quantity of prescriptions finalized per weekday
                </p>
              </div>
              <div className="h-64 w-full relative">
                {mounted && (
                  <Bar data={barChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Top Prescribed Medicines */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant flex flex-col justify-between hover:shadow-xs transition-all">
              <div>
                <h3 className="font-bold text-on-surface text-base mb-1">Top Prescribed Medicines</h3>
                <p className="text-xs text-on-surface-variant mb-5">
                  Most frequently prescribed medicines in your practice
                </p>

                {topMeds.length === 0 && (
                  <p className="text-sm text-on-surface-variant py-6 text-center">
                    No medicines prescribed yet.
                  </p>
                )}

                <div className="space-y-4">
                  {topMeds.map((med: any, idx: number) => {
                    const maxVal = Math.max(...topMeds.map((m: any) => m.prescriptionsCount), 1);
                    const pct = (med.prescriptionsCount / maxVal) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <div>
                            <p className="font-bold text-on-surface">{med.brandName}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">{med.generic}</p>
                          </div>
                          <span className="font-bold text-primary">{med.prescriptionsCount} Rx</span>
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

              <Link href="/dashboard/prescriptions" className="mt-6">
                <Button variant="outline" className="w-full text-xs font-bold flex items-center justify-center gap-2 h-10 border-gray-200 dark:border-slate-800">
                  <span>View All Prescriptions</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
