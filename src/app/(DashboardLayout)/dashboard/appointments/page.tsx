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
  const [showNew, setShowNew] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [newForm, setNewForm] = useState({ chamberId: "", patientId: "", date: "" });
  const [savingNew, setSavingNew] = useState(false);

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
      const payload = res.data?.data ?? res.data;
      const items = Array.isArray(payload) ? payload : payload?.items ?? [];
      setAppointments(
        items.map((a: any) => ({
          ...a,
          scheduledDate: a.scheduledDate ?? a.appointmentDate,
          serialNumber: a.serialNumber ?? a.serialNo,
        })),
      );
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

  const openNewAppointment = async () => {
    setShowNew(true);
    setNewForm({
      chamberId: selectedChamber || chambers[0]?.id || "",
      patientId: "",
      date: new Date().toISOString().slice(0, 10),
    });
    try {
      const [pRes, dRes] = await Promise.all([
        apiClient.get<any>(API_ROUTES.PATIENTS.LIST),
        apiClient.get<any>(API_ROUTES.DOCTOR.PROFILE),
      ]);
      const pPayload = pRes.data?.data ?? pRes.data;
      setPatients(Array.isArray(pPayload) ? pPayload : pPayload?.items ?? []);
      const dPayload = dRes.data?.data ?? dRes.data;
      setDoctorId(dPayload?.id || "");
    } catch {
      // non-fatal; the form will validate below
    }
  };

  const createAppointment = async () => {
    // Resolve the active workspace (localStorage may not be initialized yet).
    let wsId = workspaceId;
    if (!wsId) {
      try {
        const wsRes = await apiClient.get<any>(API_ROUTES.WORKSPACES.LIST);
        const list = wsRes.data?.data || wsRes.data || [];
        wsId = list[0]?.id ?? null;
        if (wsId) setWorkspaceId(wsId);
      } catch {
        // handled below
      }
    }
    if (!wsId) {
      toast({ title: "No workspace", description: "Select a workspace first.", variant: "destructive" });
      return;
    }
    if (!newForm.chamberId || !newForm.patientId || !newForm.date || !doctorId) {
      toast({ title: "Missing fields", description: "Chamber, patient and date are required.", variant: "destructive" });
      return;
    }
    setSavingNew(true);
    try {
      await apiClient.post<any>(API_ROUTES.APPOINTMENTS.CREATE(wsId), {
        chamberId: newForm.chamberId,
        patientId: newForm.patientId,
        doctorId,
        appointmentDate: newForm.date,
      });
      toast({ title: "Appointment booked", description: "The appointment has been scheduled.", variant: "success" });
      setShowNew(false);
      loadAppointments();
    } catch (e: any) {
      toast({
        title: "Booking failed",
        description: e.response?.data?.message || "Could not book the appointment.",
        variant: "destructive",
      });
    } finally {
      setSavingNew(false);
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
          <Button className="flex items-center gap-2" onClick={openNewAppointment}>
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

      {/* New Appointment Modal */}
      {showNew && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowNew(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">New Appointment</h2>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Chamber *</label>
                <select
                  value={newForm.chamberId}
                  onChange={(e) => setNewForm({ ...newForm, chamberId: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none dark:border-slate-800"
                >
                  <option value="">Select chamber</option>
                  {chambers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Patient *</label>
                <select
                  value={newForm.patientId}
                  onChange={(e) => setNewForm({ ...newForm, patientId: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none dark:border-slate-800"
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.phone ? ` — ${p.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Date *</label>
                <Input
                  type="date"
                  value={newForm.date}
                  onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                />
              </div>

              {!doctorId && (
                <p className="text-xs font-semibold text-amber-600">
                  No doctor profile found for this account — booking requires one.
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-outline-variant pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={createAppointment} disabled={savingNew}>
                {savingNew ? "Booking…" : "Book Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
