"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Droplets,
  AlertTriangle,
  Heart,
  FileText,
  Clock,
  User,
  MapPin,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Patient, Prescription, PrescriptionStatus } from "@/types";
import { normalizePrescriptions } from "@/lib/prescriptions";
import { formatDate, formatDateTime } from "@/lib/utils";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
    FINALIZED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-on-surface-variant mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm text-on-surface font-medium">{value}</p>
      </div>
    </div>
  );
}

// ─── Timeline Event ───────────────────────────────────────────────────────────
// The timeline endpoint returns { type, id, date, ...typeSpecificFields }.
type TimelineEventRaw = {
  type: string;
  id: string;
  date: string;
  // appointment
  chamberName?: string | null;
  doctorName?: string | null;
  status?: string | null;
  serialNo?: number | null;
  notes?: string | null;
  // prescription
  diagnosis?: string | null;
  complaints?: string | null;
  // audit
  actionType?: string | null;
};

const humanize = (value?: string | null) =>
  value ? value.toLowerCase().replace(/_/g, " ") : "";

const timelineMeta = (event: TimelineEventRaw) => {
  switch (event.type) {
    case "appointment":
      return {
        Icon: Calendar,
        title: "Appointment",
        description: [
          humanize(event.status),
          event.serialNo != null ? `Serial ${event.serialNo}` : null,
          event.chamberName,
          event.notes,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    case "prescription":
      return {
        Icon: FileText,
        title: "Prescription",
        description: [event.diagnosis || event.complaints, humanize(event.status)]
          .filter(Boolean)
          .join(" · "),
      };
    case "audit":
      return {
        Icon: Activity,
        title: "Patient record",
        description: humanize(event.actionType),
      };
    default:
      return {
        Icon: Activity,
        title: humanize(event.type) || "Event",
        description: "",
      };
  }
};

function TimelineEvent({ event }: { event: TimelineEventRaw }) {
  const { Icon, title, description } = timelineMeta(event);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="w-px flex-1 bg-outline-variant mt-1" />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-sm font-medium text-on-surface">{title}</p>
        {description && (
          <p className="text-xs text-on-surface-variant mt-0.5 capitalize">{description}</p>
        )}
        <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDateTime(event.date)}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-outline-variant/40 ${className}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<TimelineEventRaw[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "prescriptions" | "timeline">(
    "overview"
  );

  useEffect(() => {
    if (!params?.id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [patientRes, timelineRes, rxRes] = await Promise.all([
          apiClient.get<any>(API_ROUTES.PATIENTS.GET(params.id)),
          apiClient.get<any>(API_ROUTES.PATIENTS.TIMELINE(params.id)),
          // The prescriptions list has no by-patient filter, so read the
          // workspace list (bounded) and keep only THIS patient's records.
          apiClient.get<any>(`${API_ROUTES.PRESCRIPTIONS.LIST}?limit=100`),
        ]);

        const p = patientRes.data?.data || patientRes.data;
        setPatient(p);

        const events = timelineRes.data?.data || timelineRes.data || [];
        setTimeline(Array.isArray(events) ? events : []);

        const rxPayload = rxRes.data?.data ?? rxRes.data;
        const rxList = Array.isArray(rxPayload)
          ? rxPayload
          : rxPayload?.prescriptions ?? [];
        // Only THIS patient's records, normalised the same way as the
        // prescriptions list/detail pages (snapshot* -> medicines shape).
        setPrescriptions(
          normalizePrescriptions(
            rxList.filter((rx: any) => rx.patientId === params.id),
          ),
        );
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load patient.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-on-surface-variant">{error}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const TABS = ["overview", "prescriptions", "timeline"] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/patients")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Patients
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      ) : patient ? (
        <>
          {/* Patient Card */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-on-surface">{patient.name}</h1>
                  <p className="text-on-surface-variant text-sm">
                    {patient.gender} · {patient.age ? `${patient.age} years` : "Age N/A"}
                    {patient.bloodGroup && (
                      <span className="ml-2 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                        {patient.bloodGroup}
                      </span>
                    )}
                  </p>
                  {patient.patientId && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      ID: {patient.patientId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <InfoRow icon={Phone} label="Phone" value={patient.phone} />
              <InfoRow icon={Mail} label="Email" value={patient.email} />
              <InfoRow icon={MapPin} label="Address" value={patient.address} />
              <InfoRow icon={Calendar} label="Date of Birth" value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : undefined} />
              <InfoRow icon={Phone} label="Emergency Contact" value={patient.emergencyContact} />
            </div>

            {(patient.allergies ||
              patient.chronicDiseases ||
              patient.chronicConditions) && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.allergies && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Allergies</p>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">{patient.allergies}</p>
                  </div>
                )}
                {(patient.chronicDiseases || patient.chronicConditions) && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Chronic Conditions</p>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {patient.chronicDiseases || patient.chronicConditions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-outline-variant">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab}
                  {tab === "prescriptions" && prescriptions.length > 0 && (
                    <span className="ml-1.5 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                      {prescriptions.length}
                    </span>
                  )}
                  {tab === "timeline" && timeline.length > 0 && (
                    <span className="ml-1.5 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                      {timeline.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="rounded-2xl border border-outline-variant bg-surface p-6">
              <h2 className="text-base font-semibold text-on-surface mb-4">Medical Notes</h2>
              {patient.patientNotes || patient.medicalNotes ? (
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                  {patient.patientNotes || patient.medicalNotes}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant italic">No medical notes recorded.</p>
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="space-y-3">
              {prescriptions.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-outline-variant">
                  <FileText className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-3" />
                  <p className="text-on-surface-variant">No prescriptions yet.</p>
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <Link key={rx.id} href={`/dashboard/prescriptions/${rx.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {rx.diagnosis || "Prescription"}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {rx.medicines?.length || 0} medicine(s) · {formatDate(rx.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={rx.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="rounded-2xl border border-outline-variant bg-surface p-6">
              {timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm">No timeline events yet.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {timeline.map((event) => (
                    <TimelineEvent key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
