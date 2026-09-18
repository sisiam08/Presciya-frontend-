"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Prescription, PrescriptionStatus } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const cfg: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    DRAFT: { label: "Draft", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
    FINALIZED: { label: "Finalized", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  };
  const c = cfg[status] || cfg.DRAFT;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${c.className}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

// ─── Medicine Row ─────────────────────────────────────────────────────────────
function MedicineRow({ med, idx }: { med: any; idx: number }) {
  const schedule = () => {
    if (med.morning != null || med.noon != null || med.night != null) {
      return `${med.morning ?? 0} + ${med.noon ?? 0} + ${med.night ?? 0}`;
    }
    if (med.dosagePattern) return med.dosagePattern;
    if (med.frequency) return med.frequency;
    return "—";
  };

  return (
    <tr className="border-b border-outline-variant last:border-0 hover:bg-surface-container/30">
      <td className="py-3 px-4 text-sm text-on-surface-variant w-8">{idx + 1}</td>
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-on-surface">{med.brandName}</p>
        {med.generic && <p className="text-xs text-on-surface-variant">{med.generic}</p>}
        {med.strength && <p className="text-xs text-on-surface-variant">{med.strength}</p>}
      </td>
      <td className="py-3 px-4 text-xs text-on-surface-variant">{med.type || "—"}</td>
      <td className="py-3 px-4 text-xs text-on-surface">{schedule()}</td>
      <td className="py-3 px-4 text-xs text-on-surface-variant">{med.duration || "—"}</td>
      <td className="py-3 px-4 text-xs text-on-surface-variant">{med.mealTiming?.replace("_", " ") || "—"}</td>
      <td className="py-3 px-4 text-xs text-on-surface-variant max-w-xs">{med.instruction || "—"}</td>
    </tr>
  );
}

export default function PrescriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(API_ROUTES.PRESCRIPTIONS.GET(params.id));
        setPrescription(res.data?.data || res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load prescription.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id]);

  const handleFinalize = async () => {
    if (!prescription || prescription.status !== PrescriptionStatus.DRAFT) return;
    setFinalizing(true);
    try {
      const res = await apiClient.patch<any>(API_ROUTES.PRESCRIPTIONS.UPDATE(prescription.id), {
        status: PrescriptionStatus.FINALIZED,
      });
      setPrescription(res.data?.data || res.data);
    } catch (e: any) {
      toast({
        title: "Finalization Failed",
        description: e?.response?.data?.message || "Failed to finalize prescription.",
        variant: "destructive",
      });
    } finally {
      setFinalizing(false);
    }
  };

  const handlePrint = () => {
    if (!prescription) return;
    const printUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}${API_ROUTES.PRESCRIPTIONS.PRINT(prescription.id)}`;
    const win = window.open(printUrl, "_blank");
    if (win) {
      win.focus();
      win.onload = () => win.print();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-on-surface-variant">{error}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/prescriptions")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Nav bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/prescriptions")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Prescriptions
        </Button>
        {prescription && (
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={prescription.status} />
            {prescription.status === PrescriptionStatus.DRAFT && (
              <Button size="sm" onClick={handleFinalize} disabled={finalizing}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {finalizing ? "Finalizing..." : "Finalize"}
              </Button>
            )}
            {prescription.status === PrescriptionStatus.FINALIZED && (
              <>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-1" /> Download PDF
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-80" />
        </div>
      ) : prescription ? (
        <>
          {/* Header card */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-6">
            <div className="flex items-start gap-4 flex-wrap justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-on-surface">
                    {prescription.diagnosis || "Prescription"}
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    Created: {formatDateTime(prescription.createdAt)}
                  </p>
                  {prescription.verificationCode && (
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                      Code: {prescription.verificationCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {prescription.patient && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                  <User className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-on-surface-variant">Patient</p>
                    <p className="text-sm font-medium text-on-surface">{prescription.patient.name}</p>
                    {prescription.patient.phone && (
                      <p className="text-xs text-on-surface-variant">{prescription.patient.phone}</p>
                    )}
                  </div>
                </div>
              )}
              {prescription.complaints && (
                <div className="p-3 rounded-xl bg-surface-container md:col-span-2">
                  <p className="text-xs text-on-surface-variant">Chief Complaints</p>
                  <p className="text-sm text-on-surface mt-0.5">{prescription.complaints}</p>
                </div>
              )}
            </div>
          </div>

          {/* Medicines */}
          <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
              <Pill className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-on-surface">
                Medicines ({prescription.medicines?.length || 0})
              </h2>
            </div>
            {prescription.medicines?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container">
                    <tr>
                      {["#", "Medicine", "Type", "Dose", "Duration", "Timing", "Instructions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left py-2 px-4 text-xs font-semibold text-on-surface-variant"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medicines.map((med, idx) => (
                      <MedicineRow key={idx} med={med} idx={idx} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                No medicines added.
              </div>
            )}
          </div>

          {/* Advice / Notes */}
          {(prescription.advises || prescription.clinicalNotes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescription.advises && (
                <div className="rounded-2xl border border-outline-variant bg-surface p-5">
                  <h3 className="text-sm font-semibold text-on-surface mb-2">Advice</h3>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                    {prescription.advises}
                  </p>
                </div>
              )}
              {prescription.clinicalNotes && (
                <div className="rounded-2xl border border-outline-variant bg-surface p-5">
                  <h3 className="text-sm font-semibold text-on-surface mb-2">Clinical Notes</h3>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                    {prescription.clinicalNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {prescription.nextVisitDate && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-sm text-on-surface">
                <span className="font-medium">Next Visit:</span>{" "}
                {formatDate(prescription.nextVisitDate)}
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
