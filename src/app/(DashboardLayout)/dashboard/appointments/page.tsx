"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarDays,
  Users,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Building2,
  Wallet,
  Clock,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import {
  API_ROUTES,
  APPOINTMENT_STATUS_CONFIG,
  APPOINTMENT_PAYMENT_STATUS_CONFIG,
  PAYMENT_METHODS,
} from "@/lib/constants";
import { Appointment, AppointmentStatus, AppointmentType, Chamber } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import AppointmentPaymentDialog from "@/components/appointment/AppointmentPaymentDialog";
import PatientCombobox from "@/components/patient/PatientCombobox";
import FeatureGate from "@/components/ui/FeatureGate";
import ChamberGate from "@/components/ui/ChamberGate";
import { useEntitlements } from "@/hooks/useEntitlements";
import { isTodayInBangladesh } from "@/lib/datetime";
import {
  persistActiveChamber,
  useActiveChamber,
} from "@/hooks/useActiveChamber";

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg =
    APPOINTMENT_STATUS_CONFIG[status] || {
      label: status,
      color: "text-gray-600 bg-gray-50",
    };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }: { status?: string }) {
  const key = (status || "PENDING") as keyof typeof APPOINTMENT_PAYMENT_STATUS_CONFIG;
  const cfg =
    APPOINTMENT_PAYMENT_STATUS_CONFIG[key] ||
    APPOINTMENT_PAYMENT_STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-on-surface-variant">{label}</span>
      <span className={strong ? "font-bold text-on-surface" : "font-medium text-on-surface"}>
        {value}
      </span>
    </div>
  );
}

const DISCOUNT_ROLES = ["OWNER", "ADMIN", "DOCTOR", "MANAGER"];

export default function AppointmentsPage() {
  return (
    <FeatureGate feature="appointments" label="Appointments">
      {/* Appointments are chamber-scoped: Personal mode shows a notice instead. */}
      <ChamberGate label="Appointments">
        <AppointmentsContent />
      </ChamberGate>
    </FeatureGate>
  );
}

function AppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  // The chamber the doctor is operating in (chosen in the sidebar switcher).
  const activeChamberId = useActiveChamber();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [doctorId, setDoctorId] = useState<string>("");
  const [myFee, setMyFee] = useState<{ visitingFee: number; followUpFee: number | null } | null>(null);
  const [newForm, setNewForm] = useState({
    chamberId: "",
    patientId: "",
    date: "",
    visitType: "NORMAL" as "NORMAL" | "FOLLOW_UP",
    discount: "",
    settle: "PENDING" as "PENDING" | "PAID" | "FREE",
    paymentMethod: "CASH",
  });
  const [savingNew, setSavingNew] = useState(false);
  const creatingRef = useRef(false);
  const [payTarget, setPayTarget] = useState<Appointment | null>(null);
  const [details, setDetails] = useState<Appointment | null>(null);
  const { entitlements } = useEntitlements();
  const apptLimit = entitlements?.features?.appointments?.limit ?? null;

  const canDiscount = DISCOUNT_ROLES.includes(role);

  useEffect(() => {
    const wsId = localStorage.getItem("activeWorkspaceId");
    setWorkspaceId(wsId);
    if (!wsId) setLoading(false);

    apiClient
      .get<any>(API_ROUTES.WORKSPACES.LIST)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const active = list.find((w: any) => w.id === wsId) || list[0];
        if (active?.role) setRole(active.role);
      })
      .catch(() => {});
  }, []);

  const loadChambers = useCallback(async () => {
    try {
      const res = await apiClient.get<any>(API_ROUTES.CHAMBERS.LIST);
      const list: Chamber[] = res.data?.data || res.data || [];
      setChambers(list);
      // The active chamber is chosen explicitly (sidebar switcher or the
      // chamber prompt) — never auto-selected, otherwise the chamber gate
      // could never show its notice.
    } catch {}
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<any>(
        API_ROUTES.APPOINTMENTS.LIST(workspaceId),
      );
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
    if (workspaceId) loadAppointments();
  }, [workspaceId]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    if (!workspaceId) return;
    try {
      await apiClient.patch(
        API_ROUTES.APPOINTMENTS.UPDATE_STATUS(workspaceId, id),
        { status },
      );
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
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
        chamberId: activeChamberId || chambers[0]?.id || "",
      patientId: "",
      date: new Date().toISOString().slice(0, 10),
      visitType: "NORMAL",
      discount: "",
      settle: "PENDING",
      paymentMethod: "CASH",
    });
    try {
      const [dRes, fRes] = await Promise.allSettled([
        apiClient.get<any>(API_ROUTES.DOCTOR.PROFILE),
        apiClient.get<any>(API_ROUTES.VISITING_FEE.MY),
      ]);
      if (dRes.status === "fulfilled") {
        const dPayload = dRes.value.data?.data ?? dRes.value.data;
        setDoctorId(dPayload?.id || "");
      }
      if (fRes.status === "fulfilled") {
        const fPayload = fRes.value.data?.data ?? fRes.value.data;
        setMyFee(fPayload ? { visitingFee: fPayload.visitingFee, followUpFee: fPayload.followUpFee } : null);
      }
    } catch {
      // non-fatal
    }
  };

  const createAppointment = async () => {
    let wsId = workspaceId;
    if (!wsId) {
      try {
        const wsRes = await apiClient.get<any>(API_ROUTES.WORKSPACES.LIST);
        const list = wsRes.data?.data || wsRes.data || [];
        wsId = list[0]?.id ?? null;
        if (wsId) setWorkspaceId(wsId);
      } catch {}
    }
    if (!wsId) {
      toast({ title: "No workspace", description: "Select a workspace first.", variant: "destructive" });
      return;
    }
    if (!newForm.patientId || !newForm.date || !doctorId) {
      toast({ title: "Missing fields", description: "Patient and date are required.", variant: "destructive" });
      return;
    }
    // Guard against duplicate submissions before the saving state re-renders.
    if (creatingRef.current) return;
    creatingRef.current = true;
    setSavingNew(true);
    try {
      await apiClient.post(API_ROUTES.APPOINTMENTS.CREATE(wsId), {
        patientId: newForm.patientId,
        doctorId,
        ...(newForm.chamberId ? { chamberId: newForm.chamberId } : {}),
        appointmentDate: newForm.date,
        appointmentType: newForm.visitType,
        paymentStatus: newForm.settle,
        ...(newForm.discount ? { discount: newForm.discount } : {}),
        ...(newForm.settle === "PAID" ? { paymentMethod: newForm.paymentMethod } : {}),
      });
      toast({ title: "Appointment booked", variant: "success" });
      setShowNew(false);
      loadAppointments();
    } catch (e: any) {
      toast({
        title: "Booking failed",
        description: e?.response?.data?.message || "Could not book the appointment.",
        variant: "destructive",
      });
    } finally {
      creatingRef.current = false;
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

  // "Today" is the Bangladesh calendar day, matching the backend's day window.
  const today = filtered.filter((a) =>
    isTodayInBangladesh(a.scheduledDate || a.appointmentDate || ""),
  );

  // All of today's appointments (not filtered by the search box) for the limit.
  const todayTotal = appointments.filter((a) =>
    isTodayInBangladesh(a.scheduledDate || a.appointmentDate || ""),
  ).length;

  const todayCollected = today
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + Number(a.paidAmount ?? 0), 0);

  const stats = [
    { title: "Today's Appointments", value: today.length, icon: CalendarDays, bgColor: "bg-primary/10", iconColor: "text-primary" },
    { title: "Pending Payments", value: today.filter((a) => a.paymentStatus === "PENDING").length, icon: Clock, bgColor: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600" },
    { title: "Collected Today", value: formatCurrency(todayCollected), icon: Wallet, bgColor: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600" },
    { title: "Queue Patients", value: filtered.length, icon: Users, bgColor: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600" },
  ];

  // Follow-up uses the follow-up fee when configured, else the normal fee.
  const previewFee =
    newForm.visitType === "FOLLOW_UP" && myFee?.followUpFee != null
      ? myFee.followUpFee
      : myFee?.visitingFee ?? 0;
  const previewPayable = (() => {
    const d = Math.min(Math.max(Number(newForm.discount) || 0, 0), previewFee);
    return Math.max(0, Math.round((previewFee - d) * 100) / 100);
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Appointments</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage the patient queue, fees and payments.
          </p>
          {apptLimit !== null && (
            <p
              className={`mt-1 text-xs font-semibold ${
                todayTotal >= apptLimit ? "text-rose-600" : "text-on-surface-variant"
              }`}
            >
              Daily appointment limit: {todayTotal} / {apptLimit}
              {todayTotal >= apptLimit ? " — limit reached, upgrade for more" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAppointments}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={openNewAppointment}
            disabled={apptLimit !== null && todayTotal >= apptLimit}
            title={
              apptLimit !== null && todayTotal >= apptLimit
                ? `You have reached today's appointment limit (${apptLimit}). Upgrade your plan for more.`
                : undefined
            }
          >
            <Plus size={16} /> New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="flex flex-col justify-between rounded-2xl border border-outline-variant bg-surface p-5 shadow-xs">
              <span className={`mb-3 inline-flex w-fit rounded-xl p-2.5 ${s.bgColor} ${s.iconColor}`}>
                <Icon size={20} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{s.title}</p>
                <p className="mt-0.5 text-2xl font-extrabold text-on-surface">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface p-4 md:flex-row">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            placeholder="Search by patient name, phone, or serial…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-10 text-xs"
          />
        </div>
        {chambers.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-on-surface-variant" />
            <select
              value={activeChamberId}
              onChange={(e) => persistActiveChamber(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-surface px-3 text-xs font-semibold text-on-surface focus:outline-none dark:border-slate-800"
            >
              {chambers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container/50">
                {["Serial", "Patient", "Chamber", "Date", "Status", "Payment", "Amount", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm font-medium text-on-surface-variant">No appointments found</td></tr>
              ) : (
                filtered.map((appt) => (
                  <tr key={appt.id} className="hover:bg-surface-container/40">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        #{appt.serialNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
                        {appt.patient?.name || "Unknown"}
                        {appt.appointmentType === AppointmentType.FOLLOW_UP && (
                          <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">
                            Follow-up
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-on-surface-variant">{appt.patient?.phone || "No phone"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-on-surface-variant">{appt.chamber?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-on-surface-variant">{formatDate(appt.scheduledDate || appt.appointmentDate || "")}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={appt.status} /></td>
                    <td className="px-5 py-3.5"><PaymentBadge status={appt.paymentStatus} /></td>
                    <td className="px-5 py-3.5 text-sm font-bold text-on-surface">
                      {formatCurrency(appt.paidAmount ?? appt.payableAmount ?? 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs font-semibold"
                          onClick={() => setDetails(appt)}
                          title="Details"
                        >
                          <Eye size={13} />
                        </Button>
                        {appt.paymentStatus === "PENDING" && (
                          <Button size="sm" className="h-8 px-3 text-xs font-semibold" onClick={() => setPayTarget(appt)}>
                            <Wallet size={13} className="mr-1" /> Collect
                          </Button>
                        )}
                        {appt.status === AppointmentStatus.CONFIRMED && (
                          <Button size="sm" variant="outline" className="h-8 px-3 text-xs font-semibold" onClick={() => updateStatus(appt.id, AppointmentStatus.RUNNING)}>
                            Start
                          </Button>
                        )}
                        {appt.status === AppointmentStatus.RUNNING && (
                          <Button size="sm" className="h-8 px-3 text-xs font-semibold" onClick={() => updateStatus(appt.id, AppointmentStatus.COMPLETED)}>
                            <CheckCircle size={13} className="mr-1" /> Complete
                          </Button>
                        )}
                        {[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RUNNING].includes(appt.status) && (
                          <Button size="sm" variant="outline" className="h-8 px-3 text-xs font-semibold text-red-600" onClick={() => updateStatus(appt.id, AppointmentStatus.CANCELLED)}>
                            <XCircle size={13} className="mr-1" /> Cancel
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
              <button onClick={() => setShowNew(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container">
                <XCircle size={16} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {chambers.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Chamber</label>
                  <select
                    value={newForm.chamberId}
                    onChange={(e) => setNewForm({ ...newForm, chamberId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-surface px-3 text-sm text-on-surface focus:outline-none dark:border-slate-800"
                  >
                    <option value="">No chamber</option>
                    {chambers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              )}

              <PatientCombobox
                value={newForm.patientId}
                onChange={(id) => setNewForm({ ...newForm, patientId: id })}
                label="Patient *"
                placeholder="Search patient or type a new name…"
              />

              {/* Visit type (normal vs follow-up) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Visit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "NORMAL", label: "New Visit" },
                    { value: "FOLLOW_UP", label: "Follow-up" },
                  ] as const).map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setNewForm({ ...newForm, visitType: t.value })}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                        newForm.visitType === t.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant text-on-surface-variant hover:border-primary/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Date *</label>
                <Input type="date" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} />
              </div>

              {/* Fee summary */}
              <div className="rounded-xl bg-surface-container/50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">
                    {newForm.visitType === "FOLLOW_UP" ? "Follow-up Fee" : "Visiting Fee"}
                  </span>
                  <span className="font-semibold text-on-surface">{formatCurrency(previewFee)}</span>
                </div>
                {canDiscount && (
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-on-surface-variant">Discount</span>
                    <Input type="number" min="0" value={newForm.discount} onChange={(e) => setNewForm({ ...newForm, discount: e.target.value })} className="h-8 w-28 text-right" placeholder="0" />
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-outline-variant pt-2 text-xs">
                  <span className="font-semibold text-on-surface">Payable</span>
                  <span className="font-bold text-primary">{formatCurrency(previewPayable)}</span>
                </div>
                {!myFee && (
                  <p className="mt-2 text-[11px] text-amber-600">
                    No visiting fee configured for this workspace yet.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Payment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PENDING", "PAID", "FREE"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewForm({ ...newForm, settle: s })}
                      disabled={s === "FREE" && !canDiscount}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                        newForm.settle === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant text-on-surface-variant hover:border-primary/40"
                      } disabled:opacity-40`}
                    >
                      {s === "PENDING" ? "Pending" : s === "PAID" ? "Paid" : "Free"}
                    </button>
                  ))}
                </div>
              </div>

              {newForm.settle === "PAID" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Payment Method</label>
                  <select
                    value={newForm.paymentMethod}
                    onChange={(e) => setNewForm({ ...newForm, paymentMethod: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-surface px-3 text-sm text-on-surface focus:outline-none dark:border-slate-800"
                  >
                    {PAYMENT_METHODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                </div>
              )}

              {!doctorId && (
                <p className="text-xs font-semibold text-amber-600">
                  No doctor profile found for this account — booking requires one.
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-outline-variant pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button className="flex-1" onClick={createAppointment} disabled={savingNew}>
                {savingNew ? "Booking…" : "Book Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details */}
      {details && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetails(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">
                Appointment Details
              </h2>
              <button
                onClick={() => setDetails(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <DetailRow label="Patient" value={details.patient?.name || "—"} />
              <DetailRow
                label="Serial"
                value={`#${details.serialNumber ?? details.serialNo}`}
              />
              <DetailRow
                label="Visit Type"
                value={
                  details.appointmentType === AppointmentType.FOLLOW_UP
                    ? "Follow-up"
                    : "New Visit"
                }
              />
              <DetailRow
                label="Date"
                value={formatDate(details.scheduledDate || details.appointmentDate || "")}
              />
              <DetailRow
                label="Status"
                value={<StatusBadge status={details.status} />}
              />

              <div className="my-2 border-t border-outline-variant" />
              <DetailRow
                label={details.appointmentType === AppointmentType.FOLLOW_UP ? "Follow-up Fee" : "Visiting Fee"}
                value={formatCurrency(details.visitingFee ?? 0)}
              />
              <DetailRow
                label="Discount"
                value={`− ${formatCurrency(details.discount ?? 0)}`}
              />
              <DetailRow
                label="Payable"
                value={formatCurrency(details.payableAmount ?? 0)}
                strong
              />
              <DetailRow
                label="Paid"
                value={formatCurrency(details.paidAmount ?? 0)}
                strong
              />
              <DetailRow
                label="Payment"
                value={<PaymentBadge status={details.paymentStatus} />}
              />
              {details.paymentMethod && (
                <DetailRow label="Method" value={details.paymentMethod} />
              )}

              {details.revenueSharePercent != null && (
                <>
                  <div className="my-2 border-t border-outline-variant" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Revenue Split
                  </p>
                  <DetailRow
                    label={`Hospital / Clinic (${Number(details.revenueSharePercent)}%)`}
                    value={formatCurrency(details.hospitalShareAmount ?? 0)}
                  />
                  <DetailRow
                    label="Doctor Share"
                    value={formatCurrency(details.doctorShareAmount ?? 0)}
                  />
                </>
              )}
            </div>

            {details.paymentStatus === "PENDING" && (
              <div className="mt-5">
                <Button
                  className="w-full"
                  onClick={() => {
                    setPayTarget(details);
                    setDetails(null);
                  }}
                >
                  <Wallet className="mr-2 h-4 w-4" /> Collect Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AppointmentPaymentDialog
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        onSaved={loadAppointments}
        workspaceId={workspaceId || ""}
        appointment={payTarget}
        canDiscount={canDiscount}
      />
    </div>
  );
}
