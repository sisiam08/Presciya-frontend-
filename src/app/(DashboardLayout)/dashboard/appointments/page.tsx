// src/app/(DashboardLayout)/dashboard/appointments/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Building2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, APPOINTMENT_STATUS_CONFIG } from "@/lib/constants";
import { Appointment, AppointmentStatus, Chamber } from "@/types";
import { formatDate } from "@/lib/utils";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = APPOINTMENT_STATUS_CONFIG[status] || { label: status, color: "text-gray-600 bg-gray-50" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const wsId = localStorage.getItem("activeWorkspaceId");
    setWorkspaceId(wsId);
    if (!wsId) {
      setLoading(false);
    }
    
    // Watch activeWorkspaceId initialization
    const checkInterval = setInterval(() => {
      const currentWsId = localStorage.getItem("activeWorkspaceId");
      if (currentWsId && currentWsId !== wsId) {
        setWorkspaceId(currentWsId);
        clearInterval(checkInterval);
      }
    }, 800);

    return () => clearInterval(checkInterval);
  }, []);

  const loadChambers = useCallback(async () => {
    try {
      const res = await apiClient.get<any>(API_ROUTES.CHAMBERS.LIST);
      const list: Chamber[] = res.data?.data || res.data || [];
      setChambers(list);
      if (list.length > 0 && !selectedChamber) {
        setSelectedChamber(list[0].id);
      }
    } catch {}
  }, [selectedChamber]);

  const loadAppointments = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.APPOINTMENTS.LIST(workspaceId));
      setAppointments(res.data?.data || res.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadChambers();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      loadAppointments();
    }
  }, [workspaceId]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    if (!workspaceId) return;
    try {
      await apiClient.patch<any>(API_ROUTES.APPOINTMENTS.UPDATE_STATUS(workspaceId, id), {
        status,
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (e: any) {
      toast({
        title: "Appointment Error",
        description: e?.response?.data?.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.patient?.name?.toLowerCase().includes(q) ||
      a.patient?.phone?.includes(q) ||
      String(a.serialNumber).includes(q)
    );
  });

  const today = filtered.filter(
    (a) => new Date(a.scheduledDate).toDateString() === new Date().toDateString()
  );

  const stats = [
    {
      title: "Today's Appointments",
      value: today.length,
      change: "Scheduled Today",
      changeColor: "text-primary font-bold",
      icon: CalendarDays,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Running Consultation",
      value: filtered.filter((a) => a.status === AppointmentStatus.RUNNING).length,
      change: "In Progress",
      changeColor: "text-amber-600 font-bold",
      icon: Clock,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
    {
      title: "Completed Visits",
      value: filtered.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
      change: "Done",
      changeColor: "text-emerald-600 font-bold",
      icon: CheckCircle,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      title: "Total Queue Patients",
      value: filtered.length,
      change: "Active Queue",
      changeColor: "text-purple-600 font-bold",
      icon: Users,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Appointments</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage today&apos;s patient queue and visit schedule across all chambers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAppointments}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            New Appointment
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid (Bento UI) */}
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

      {/* Chamber Selector & Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-outline-variant flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by patient name, phone, or serial number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {chambers.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-on-surface-variant" />
              <select
                value={selectedChamber}
                onChange={(e) => setSelectedChamber(e.target.value)}
                className="h-10 px-3 bg-surface border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-on-surface focus:outline-none"
              >
                {chambers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 flex items-center justify-center border-gray-200 dark:border-slate-800"
          >
            <Filter size={15} className="text-on-surface-variant" />
          </Button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant">
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider text-center w-16">
                  Serial
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Patient Info
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Chamber
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-on-surface-variant font-medium text-sm"
                  >
                    No appointments found matching your filter
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-surface-container/40 transition-colors group"
                  >
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        #{appt.serialNumber}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-on-surface text-sm leading-snug">
                        {appt.patient?.name || "Unknown Patient"}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                        {appt.patient?.phone || "No phone"}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-on-surface-variant">
                      {appt.chamber?.name || "General Clinic"}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-on-surface-variant">
                      {formatDate(appt.scheduledDate)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {appt.status === AppointmentStatus.SCHEDULED && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-semibold"
                            onClick={() => updateStatus(appt.id, AppointmentStatus.RUNNING)}
                          >
                            Start
                          </Button>
                        )}
                        {appt.status === AppointmentStatus.RUNNING && (
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold"
                            onClick={() => updateStatus(appt.id, AppointmentStatus.COMPLETED)}
                          >
                            <CheckCircle size={13} className="mr-1" />
                            Complete
                          </Button>
                        )}
                        {[AppointmentStatus.SCHEDULED, AppointmentStatus.RUNNING].includes(appt.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => updateStatus(appt.id, AppointmentStatus.CANCELLED)}
                          >
                            <XCircle size={13} className="mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
