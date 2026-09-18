"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Edit2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Pill,
  Check,
  Printer,
} from "lucide-react";
import { useMutation, useQuery } from "@/hooks/useApi";
import { useNotification } from "@/hooks/useNotification";
import { API_ROUTES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Prescription, PrescriptionStatus } from "@/types";
import PrescriptionBuilder from "@/components/prescription/PrescriptionBuilder";
import PrescriptionPrintModal from "@/components/prescription/PrescriptionPrintModal";
import { AnimatePresence, motion } from "framer-motion";

export default function PrescriptionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [printPrescription, setPrintPrescription] = useState<Prescription | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

  const { success, error: showError } = useNotification();

  // Load prescriptions from backend
  const { data: prescriptionsData, loading, refetch } = useQuery<any>(
    API_ROUTES.PRESCRIPTIONS.LIST
  );

  const rawPrescriptions: any[] = prescriptionsData?.data || prescriptionsData || [];
  // The API returns medicine lines as `prescriptionMedicines` with snapshot*
  // fields; normalize to the `medicines` shape the list/detail/builder expect.
  const prescriptions: Prescription[] = rawPrescriptions.map((p) => ({
    ...p,
    medicines: (p.prescriptionMedicines ?? p.medicines ?? []).map((m: any) => ({
      ...m,
      brandName: m.brandName ?? m.snapshotBrandName,
      generic: m.generic ?? m.snapshotGeneric,
      strength: m.strength ?? m.snapshotStrength,
      type: m.type ?? m.snapshotType,
      frequency: m.frequency ?? m.dosagePattern,
    })),
  }));

  const { mutate: deletePrescription } = useMutation("delete", {
    onSuccess: () => {
      success("Prescription deleted");
      refetch();
    },
    onError: () => showError("Failed to delete prescription"),
  });

  const { mutate: amendPrescription } = useMutation("post", {
    onSuccess: (res: any) => {
      const raw = res?.data || res;
      const draft = {
        ...raw,
        medicines: (raw?.prescriptionMedicines ?? raw?.medicines ?? []).map(
          (m: any) => ({
            ...m,
            brandName: m.brandName ?? m.snapshotBrandName,
            generic: m.generic ?? m.snapshotGeneric,
            strength: m.strength ?? m.snapshotStrength,
            type: m.type ?? m.snapshotType,
            frequency: m.frequency ?? m.dosagePattern,
          }),
        ),
      };
      success("A corrected draft version was created");
      setSelectedPrescription(null);
      setEditingPrescription(draft);
      setIsBuilderOpen(true);
      refetch();
    },
    onError: () => showError("Failed to create a corrected version"),
  });

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchSearch =
      (rx.patient?.name || rx.patientId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rx.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rx.serialNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || rx.status === (filterStatus as unknown as PrescriptionStatus);
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this prescription?")) {
      await deletePrescription(API_ROUTES.PRESCRIPTIONS.DELETE(id));
    }
  };

  const handleEdit = (rx: Prescription) => {
    setEditingPrescription(rx);
    setIsBuilderOpen(true);
  };

  const statusConfig = {
    DRAFT: { icon: Clock, color: "text-amber-600 font-bold", bg: "bg-amber-50 dark:bg-amber-950/30" },
    FINALIZED: { icon: CheckCircle, color: "text-emerald-600 font-bold", bg: "bg-teal-50 dark:bg-teal-950/30" },
    CANCELLED: { icon: XCircle, color: "text-red-600 font-bold", bg: "bg-red-50 dark:bg-red-950/30" },
  };

  const kpis = [
    {
      title: "Total Prescriptions",
      value: String(prescriptions.length),
      change: "All Time",
      changeColor: "text-primary font-bold",
      icon: FileText,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Finalized Records",
      value: String(prescriptions.filter((p) => p.status === PrescriptionStatus.FINALIZED).length),
      change: "Issued",
      changeColor: "text-emerald-600 font-bold",
      icon: CheckCircle,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      title: "Draft Prescriptions",
      value: String(prescriptions.filter((p) => p.status === PrescriptionStatus.DRAFT).length),
      change: "Pending",
      changeColor: "text-amber-600 font-bold",
      icon: Clock,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
    {
      title: "Medicines Prescribed",
      value: String(prescriptions.reduce((acc, p) => acc + (p.medicines?.length || 0), 0)),
      change: "Items",
      changeColor: "text-purple-600 font-bold",
      icon: Pill,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Prescriptions</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Create, search, print and manage medical prescriptions across chambers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button onClick={() => { setEditingPrescription(null); setIsBuilderOpen(true); }} className="flex items-center gap-2">
            <Plus size={16} /> New Prescription
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid (Bento UI) */}
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

      {/* Search & Filter */}
      <div className="bg-surface p-4 rounded-2xl border border-outline-variant flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
          <Input
            placeholder="Search by patient name, diagnosis, or serial number…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 bg-surface border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-on-surface focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="FINALIZED">Finalized</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 flex items-center justify-center border-gray-200 dark:border-slate-800"
          >
            <Filter size={15} className="text-on-surface-variant" />
          </Button>
        </div>
      </div>

      {/* Prescription Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant shadow-xs">
          <FileText size={40} className="mx-auto text-on-surface-variant mb-3 opacity-40" />
          <p className="text-on-surface-variant text-sm font-medium">
            {searchTerm ? "No prescription match found" : "No prescription records yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.map((rx) => {
            const Status = statusConfig[rx.status as keyof typeof statusConfig];
            const StatusIcon = Status?.icon || Clock;
            return (
              <div key={rx.id} className="border border-outline-variant hover:shadow-md transition-shadow bg-surface rounded-2xl p-5 flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        #{rx.serialNumber || rx.id?.substring(0, 8).toUpperCase()}
                      </span>
                      <h3 className="text-base font-bold text-on-surface line-clamp-1 mt-0.5">
                        {rx.patient?.name || "Patient Record"}
                      </h3>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${Status?.bg}`}>
                      <StatusIcon size={12} className={Status?.color} />
                      <span className={Status?.color}>{rx.status}</span>
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-3">
                    {rx.diagnosis || "General Consultation"}
                  </p>

                  <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-3 space-y-1 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-on-surface mb-1">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Medicines</span>
                      <span className="text-[11px] text-primary">{rx.medicines?.length || 0} item(s)</span>
                    </div>
                    {rx.medicines?.slice(0, 2).map((med, idx) => (
                      <p key={idx} className="text-xs text-on-surface truncate font-medium">
                        • {med.brandName} <span className="text-on-surface-variant text-[11px]">({med.frequency || "1+0+1"})</span>
                      </p>
                    ))}
                    {(rx.medicines?.length || 0) > 2 && (
                      <p className="text-[10px] text-on-surface-variant font-bold mt-1">
                        +{(rx.medicines?.length || 0) - 2} more medicines
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {formatDate(rx.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPrescription(rx)} title="View" className="h-8 w-8 p-0">
                      <Eye size={14} />
                    </Button>
                    {rx.status === PrescriptionStatus.DRAFT && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rx)} title="Edit" className="h-8 w-8 p-0">
                        <Edit2 size={14} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rx.id)} title="Delete" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPrescription && (
          <PrescriptionPreview
            prescription={selectedPrescription}
            onClose={() => setSelectedPrescription(null)}
            onPrint={() => setPrintPrescription(selectedPrescription)}
            onAmend={() =>
              amendPrescription(API_ROUTES.PRESCRIPTIONS.AMEND(selectedPrescription.id))
            }
          />
        )}
      </AnimatePresence>

      {/* Canonical A4 preview / print */}
      <AnimatePresence>
        {printPrescription && (
          <PrescriptionPrintModal
            prescriptionId={printPrescription.id}
            status={printPrescription.status}
            onClose={() => setPrintPrescription(null)}
          />
        )}
      </AnimatePresence>

      {/* Builder Modal */}
      <AnimatePresence>
        {isBuilderOpen && (
          <PrescriptionBuilder prescription={editingPrescription} onClose={() => { setIsBuilderOpen(false); setEditingPrescription(null); refetch(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PrescriptionPreview({ prescription, onClose, onPrint, onAmend }: { prescription: Prescription; onClose: () => void; onPrint: () => void; onAmend: () => void }) {
  const isFinalized = prescription.status === "FINALIZED";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-xs" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} onClick={(e) => e.stopPropagation()} className="bg-surface rounded-2xl max-w-2xl w-full border border-outline-variant max-h-[90vh] overflow-y-auto shadow-2xl z-10">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container/50">
          <h2 className="text-base font-bold text-on-surface">Prescription Details (#{prescription.serialNumber || prescription.id?.substring(0, 8)})</h2>
          <div className="flex items-center gap-2">
            {isFinalized && (
              <Button size="sm" variant="outline" onClick={onAmend}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Amend
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onPrint}>
              <Printer className="mr-1.5 h-4 w-4" />
              Preview / Print
            </Button>
            <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container font-semibold">✕</button>
          </div>
        </div>
        <div className="p-6 space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Patient</p><p className="font-bold text-on-surface mt-0.5 text-base">{prescription.patient?.name || prescription.patientId}</p></div>
            <div><p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Status</p><p className="font-bold text-on-surface mt-0.5">{prescription.status}</p></div>
          </div>
          {prescription.diagnosis && (
            <div><p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Diagnosis</p><p className="font-medium text-on-surface mt-0.5">{prescription.diagnosis}</p></div>
          )}
          {prescription.medicines && prescription.medicines.length > 0 && (
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-2">Medicines Prescribed</p>
              <div className="border border-outline-variant/60 rounded-xl divide-y divide-outline-variant/40 overflow-hidden bg-surface-container/30">
                {prescription.medicines.map((m, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-on-surface">{m.brandName} <span className="font-medium text-on-surface-variant">({m.generic || m.type})</span></p>
                      <p className="text-on-surface-variant text-[11px]">{m.dosagePattern || m.frequency} • {m.duration} • {m.mealTiming}</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">{m.strength || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
