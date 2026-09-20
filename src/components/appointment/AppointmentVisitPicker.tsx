"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, Check, AlertTriangle, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, APPOINTMENT_PAYMENT_STATUS_CONFIG } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";
import { Appointment } from "@/types";

interface AppointmentVisitPickerProps {
  workspaceId: string;
  patientId: string;
  appointmentId: string;
  /** When true, an eligible visit is required to prescribe. */
  required?: boolean;
  onSelect: (payload: {
    patientId: string;
    appointmentId: string;
    label: string;
    eligible: boolean;
    paymentStatus?: string;
    fee?: number;
  }) => void;
}

interface PatientRow {
  id: string;
  name: string;
  phone?: string | null;
}

const eligibleStatuses = ["PAID", "FREE"];

/**
 * Patient / visit finder for the prescription flow in CHAMBER and INSTITUTION
 * context. Shows today's appointments (serial / phone / name) and existing
 * patients, and lets the doctor create a follow-up visit when there is no
 * appointment today. Only PAID or FREE visits make a prescription eligible.
 */
export default function AppointmentVisitPicker({
  workspaceId,
  patientId,
  appointmentId,
  required = true,
  onSelect,
}: AppointmentVisitPickerProps) {
  const { error: showError } = useNotification();
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Follow-up creation panel
  const [followUpFor, setFollowUpFor] = useState<PatientRow | null>(null);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);

  const loadToday = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await apiClient.get<any>(
        `${API_ROUTES.APPOINTMENTS.SEARCH_TODAY(workspaceId)}?q=${encodeURIComponent(query)}`,
      );
      setAppointments(res.data?.data || res.data || []);
    } catch {
      setAppointments([]);
    }
  }, [workspaceId, query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      await loadToday();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [loadToday]);

  // Patient search (existing patients).
  useEffect(() => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get<any>(
          `${API_ROUTES.PATIENTS.SEARCH}?q=${encodeURIComponent(query)}&limit=6`,
        );
        const list = res.data?.data || res.data || [];
        setPatients(Array.isArray(list) ? list : list?.items ?? []);
      } catch {
        setPatients([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const selectAppointment = (appt: Appointment) => {
    const eligible = eligibleStatuses.includes(appt.paymentStatus || "");
    onSelect({
      patientId: appt.patientId,
      appointmentId: appt.id,
      label: `${appt.patient?.name || "Patient"} · Serial #${appt.serialNumber ?? appt.serialNo}`,
      eligible,
      paymentStatus: appt.paymentStatus,
      fee: Number(appt.paidAmount ?? appt.payableAmount ?? 0),
    });
  };

  const createFollowUp = async (patient: PatientRow, settle: "PENDING" | "PAID" | "FREE") => {
    if (!workspaceId) return;
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const res = await apiClient.post<any>(
        API_ROUTES.APPOINTMENTS.CREATE(workspaceId),
        {
          patientId: patient.id,
          appointmentDate: new Date().toISOString().slice(0, 10),
          appointmentType: "FOLLOW_UP",
          paymentStatus: settle,
        },
      );
      const created: Appointment = res.data?.data || res.data;
      setFollowUpFor(null);
      await loadToday();
      selectAppointment(created);
    } catch (e: any) {
      setFollowUpFor(null);
      showError(
        e?.response?.data?.message || "Failed to create the follow-up visit",
      );
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  const selectedAppt = appointments.find((a) => a.id === appointmentId);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
          Find Patient / Appointment *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by serial, phone, or name…"
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Selected visit */}
      {appointmentId && selectedAppt && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            eligibleStatuses.includes(selectedAppt.paymentStatus || "")
              ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
          }`}
        >
          <p className="flex items-center gap-1.5 font-semibold text-on-surface">
            <Check className="h-3.5 w-3.5" />
            {selectedAppt.patient?.name} · Serial #
            {selectedAppt.serialNumber ?? selectedAppt.serialNo}
          </p>
          <p className="mt-0.5 text-on-surface-variant">
            {eligibleStatuses.includes(selectedAppt.paymentStatus || "")
              ? "Paid — prescription allowed"
              : "Payment pending — prescription is blocked until paid"}
          </p>
        </div>
      )}

      {/* Today's appointments */}
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Today&apos;s Appointments
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-on-surface-variant">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : appointments.length === 0 ? (
          <p className="py-2 text-xs text-on-surface-variant">
            No appointments for today.
          </p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {appointments.map((appt) => {
              const eligible = eligibleStatuses.includes(appt.paymentStatus || "");
              const cfg =
                APPOINTMENT_PAYMENT_STATUS_CONFIG[
                  (appt.paymentStatus || "PENDING") as keyof typeof APPOINTMENT_PAYMENT_STATUS_CONFIG
                ];
              return (
                <button
                  key={appt.id}
                  type="button"
                  onClick={() => selectAppointment(appt)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    appointmentId === appt.id
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant hover:border-primary/40"
                  }`}
                >
                  <span>
                    <span className="font-semibold text-on-surface">
                      #{appt.serialNumber ?? appt.serialNo} {appt.patient?.name}
                    </span>
                    <span className="ml-2 text-on-surface-variant">
                      {appt.patient?.phone || ""}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg?.color || ""}`}>
                    {cfg?.label || appt.paymentStatus}
                    {eligible ? "" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing patients (follow-up) */}
      {query.trim() && (
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Existing Patients
          </p>
          {patients.length === 0 ? (
            <p className="py-2 text-xs text-on-surface-variant">
              No existing patients match “{query}”.
            </p>
          ) : (
            <div className="space-y-1">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-outline-variant px-3 py-2 text-xs"
                >
                  <span>
                    <span className="font-semibold text-on-surface">{p.name}</span>
                    <span className="ml-2 text-on-surface-variant">{p.phone || ""}</span>
                  </span>
                  {followUpFor?.id === p.id ? null : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setFollowUpFor(p)}
                    >
                      <UserPlus className="mr-1 h-3 w-3" /> Create Follow-up
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {followUpFor && (
            <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                <Wallet className="h-3.5 w-3.5" /> Follow-up visit for{" "}
                {followUpFor.name}
              </p>
              <p className="mb-2 flex items-start gap-1.5 text-[11px] text-on-surface-variant">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                This creates a new visit with today&apos;s serial and the
                follow-up fee.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={creating}
                  onClick={() => createFollowUp(followUpFor, "PAID")}
                >
                  {creating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Paid
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={creating}
                  onClick={() => createFollowUp(followUpFor, "FREE")}
                >
                  Free
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  disabled={creating}
                  onClick={() => createFollowUp(followUpFor, "PENDING")}
                >
                  Pay later
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-on-surface-variant"
                  onClick={() => setFollowUpFor(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!appointmentId && (
        <p className="text-[11px] text-on-surface-variant">
          {required
            ? "A paid or free visit is required before a prescription can be created."
            : "Optional here — prescribe directly, or select / create a visit above."}
        </p>
      )}
    </div>
  );
}
