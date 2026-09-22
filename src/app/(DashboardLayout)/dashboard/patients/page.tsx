// src/app/(DashboardLayout)/dashboard/patients/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { useQuery, useMutation } from "@/hooks/useApi";
import { useNotification } from "@/hooks/useNotification";
import { useConfirm } from "@/components/ui/confirm";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PatientFormDialog from "@/components/patient/PatientFormDialog";
import { useActiveChamber } from "@/hooks/useActiveChamber";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { success, error: showError } = useNotification();
  const confirm = useConfirm();

  // Fetch patients. The API returns { success, data: Patient[], meta }.
  const {
    data: patientsResponse,
    loading,
    refetch,
  } = useQuery<any>(API_ROUTES.PATIENTS.LIST);

  // The operating chamber is part of the data scope: refetch when it changes
  // so the previous chamber's patients never stay on screen.
  const activeChamberId = useActiveChamber();
  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChamberId]);

  const patients: Patient[] = Array.isArray(patientsResponse)
    ? patientsResponse
    : patientsResponse?.data ?? [];
  const totalPatients = patientsResponse?.meta?.total ?? patients.length;
  const totalPages = patientsResponse?.meta?.totalPages ?? 1;

  // Delete mutation
  const { mutate: deletePatient } = useMutation("delete", {
    onSuccess: () => {
      success("Patient deleted successfully");
      refetch();
    },
    onError: () => showError("Failed to delete patient"),
  });

  // Filter patients based on search and other selectors
  const filteredPatients = (patients || []).filter((patient) => {
    const matchSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this patient record?",
      description:
        "The patient will be removed from the directory. Prescription history is preserved.",
      confirmLabel: "Delete patient",
      variant: "danger",
    });
    if (!ok) return;
    await deletePatient(API_ROUTES.PATIENTS.DELETE(id));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const totalCount = (patients || []).length;
  const maleCount = (patients || []).filter((p) => p.gender === "MALE").length;
  const femaleCount = (patients || []).filter((p) => p.gender === "FEMALE").length;
  const recentCount = (patients || []).filter(
    (p) => p.createdAt && new Date(p.createdAt).getTime() > Date.now() - 7 * 86400000
  ).length;

  const kpis = [
    {
      title: "Total Patients",
      value: String(totalCount),
      change: "Active Directory",
      changeColor: "text-primary font-bold",
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Male Patients",
      value: String(maleCount),
      change: `${totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0}%`,
      changeColor: "text-teal-600 font-bold",
      icon: UserCheck,
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600",
    },
    {
      title: "Female Patients",
      value: String(femaleCount),
      change: `${totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0}%`,
      changeColor: "text-purple-600 font-bold",
      icon: Activity,
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
    {
      title: "New This Week",
      value: String(recentCount),
      change: "Recent",
      changeColor: "text-amber-600 font-bold",
      icon: Clock,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Patient Directory</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage and monitor your patient database across all chambers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {/* Same full patient form as the Appointment and Personal
              prescription flows (one shared component). */}
          <Button
            onClick={() => {
              setEditingPatient(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> New Patient
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid */}
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

      {/* Filters and Search Area */}
      <div className="bg-surface p-4 rounded-2xl border border-outline-variant flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
          <Input
            type="text"
            placeholder="Search patients by name, ID, or phone number…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>
        {/* The chamber context is chosen in the workspace switcher, so no
            per-page chamber filter is offered here. */}
      </div>

      {/* Patient Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50 border-b border-outline-variant">
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider text-center">
                  Age
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3.5 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  Last Visit
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
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-on-surface-variant font-medium text-sm"
                  >
                    {searchTerm
                      ? "No patient match found"
                      : "No patient records yet"}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-surface-container/40 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm leading-snug">
                            {patient.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mt-0.5">
                            <Phone size={11} />
                            <span>{patient.phone || "No phone"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-on-surface-variant">
                      #{patient.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3.5 text-center text-xs font-semibold text-on-surface">
                      {patient.age}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                        {patient.gender}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-on-surface-variant">
                      {patient.lastVisit
                        ? formatDate(patient.lastVisit)
                        : "Never"}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                          className="h-8 w-8 p-0 text-on-surface-variant hover:bg-surface-container"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(patient.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={13} />
                        </Button>
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          <Button size="sm" className="h-8 px-3 text-xs font-semibold">
                            View History
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-surface-container/30 px-6 py-3.5 flex items-center justify-between border-t border-outline-variant">
          <p className="text-xs font-semibold text-on-surface-variant">
            Showing {filteredPatients.length === 0 ? 0 : 1} to{" "}
            {filteredPatients.length} of {totalPatients} patients
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border border-gray-200 dark:border-slate-800"
                disabled
              >
                <ChevronLeft size={14} />
              </Button>
              <button className="w-8 h-8 bg-primary text-on-primary rounded-lg font-bold text-xs">
                1
              </button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border border-gray-200 dark:border-slate-800"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Patient Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <PatientFormDialog
            patient={editingPatient}
            onClose={handleCloseModal}
            onSuccess={() => {
              handleCloseModal();
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
