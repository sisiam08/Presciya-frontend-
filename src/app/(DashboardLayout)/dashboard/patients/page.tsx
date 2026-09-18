// src/app/(DashboardLayout)/dashboard/patients/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  Calendar,
  Filter,
  Users,
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
import { patientSchema, type PatientFormData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [chamberFilter, setChamberFilter] = useState("All Chambers");
  const [conditionFilter, setConditionFilter] = useState("Medical Condition");
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
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={chamberFilter}
            onChange={(e) => setChamberFilter(e.target.value)}
            className="h-10 px-3 bg-surface border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-on-surface focus:outline-none"
          >
            <option>All Chambers</option>
            <option>Dhanmondi General</option>
            <option>Gulshan Clinic</option>
            <option>UHC Sylhet</option>
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="h-10 px-3 bg-surface border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-on-surface focus:outline-none"
          >
            <option>Medical Condition</option>
            <option>Hypertension</option>
            <option>Diabetes Type II</option>
            <option>Post-Op Recovery</option>
            <option>Neuropathy</option>
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
          <PatientFormModal
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

// Patient Form Modal Component
function PatientFormModal({
  patient,
  onClose,
  onSuccess,
}: {
  patient: Patient | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = React.useState<PatientFormData>({
    name: patient?.name || "",
    age: patient?.age ?? 0,
    gender: patient?.gender || "MALE",
    phone: patient?.phone || "",
    email: patient?.email || "",
    bloodGroup: patient?.bloodGroup || "",
    allergies: patient?.allergies || "",
    medicalHistory: patient?.medicalNotes || "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const { success, error: showError } = useNotification();

  const { mutate: savePatient, loading } = useMutation(
    patient ? "put" : "post",
    {
      onSuccess: () => {
        success(
          `Patient record ${patient ? "updated" : "created"} successfully`,
        );
        onSuccess();
      },
      onError: () => showError("Failed to save patient record"),
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Patient name is required";
    if (!formData.age || formData.age <= 0) errs.age = "Valid age is required";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return showError("Please fix form errors shown below");
    }
    setFieldErrors({});

    try {
      const url = patient
        ? API_ROUTES.PATIENTS.UPDATE(patient.id)
        : API_ROUTES.PATIENTS.CREATE;

      await savePatient(url, formData);
    } catch (err: any) {
      showError(err?.message || "Failed to save patient record");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="bg-surface rounded-2xl max-w-lg w-full border border-outline-variant max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col z-10"
      >
        <div className="p-5 border-b border-outline-variant bg-surface-container/50">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span>
              {patient ? "Edit Patient Details" : "Register New Patient"}
            </span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm flex-1">
          {/* Name */}
          <div>
            <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Name *
            </Label>
            <Input
              type="text"
              placeholder="Full patient name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={fieldErrors.name ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                ⚠️ {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Age */}
            <div>
              <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Age *
              </Label>
              <Input
                type="number"
                placeholder="Age in years"
                value={formData.age || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    age: parseInt(e.target.value) || 0,
                  });
                  setFieldErrors((prev) => ({ ...prev, age: "" }));
                }}
                className={fieldErrors.age ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {fieldErrors.age && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors.age}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Gender *
              </Label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as any })
                }
                className="w-full h-10 px-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-surface text-on-surface focus:outline-none text-xs font-semibold"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Phone
              </Label>
              <Input
                type="tel"
                placeholder="+880 1712-345678"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            {/* Blood Group */}
            <div>
              <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Blood Group
              </Label>
              <select
                value={formData.bloodGroup || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bloodGroup: e.target.value })
                }
                className="w-full h-10 px-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-surface text-on-surface focus:outline-none text-xs font-semibold"
              >
                <option value="">Select</option>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Email
            </Label>
            <Input
              type="email"
              placeholder="patient@example.com"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Allergies */}
          <div>
            <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Allergies
            </Label>
            <Textarea
              placeholder="Penicillin, Dust..."
              value={formData.allergies || ""}
              onChange={(e) =>
                setFormData({ ...formData, allergies: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Medical History */}
          <div>
            <Label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              Medical History
            </Label>
            <Textarea
              placeholder="Hypertension, Asthma..."
              value={formData.medicalHistory || ""}
              onChange={(e) =>
                setFormData({ ...formData, medicalHistory: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 border-t border-outline-variant pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
