"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useMutation } from "@/hooks/useApi";
import { useNotification } from "@/hooks/useNotification";
import { API_ROUTES } from "@/lib/constants";
import { Patient } from "@/types";
import { type PatientFormData } from "@/lib/validation";
import {
  BD_PHONE_MESSAGE,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PatientFormDialogProps {
  /** Pass an existing patient to edit it; omit/null to create a new one. */
  patient?: Patient | null;
  onClose: () => void;
  /**
   * Called with the saved patient (create or edit) so the caller can
   * auto-select it and continue its own workflow.
   */
  onSuccess?: (patient: Patient | null) => void;
}

/**
 * The ONE full patient form, shared by the Patient page, the New Appointment
 * flow and the Personal prescription flow. Fields, validation and the
 * create/update API are identical everywhere — never fork this component.
 */
export default function PatientFormDialog({
  patient,
  onClose,
  onSuccess,
}: PatientFormDialogProps) {
  const [formData, setFormData] = React.useState<PatientFormData>({
    name: patient?.name || "",
    age: patient?.age ?? 0,
    gender: patient?.gender || "MALE",
    phone: patient?.phone || "",
    email: patient?.email || "",
    bloodGroup: patient?.bloodGroup || "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const { success, error: showError } = useNotification();

  const { mutate: savePatient, loading } = useMutation(patient ? "put" : "post", {
    onError: (err: any) =>
      showError(
        err?.response?.data?.message || "Failed to save patient record",
      ),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Re-entrancy guard: never start a second create/update while one is in
    // flight (Enter key + click, or a fast double submit).
    if (loading) return;
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Patient name is required";
    if (!formData.age || formData.age <= 0) errs.age = "Valid age is required";
    // Optional field — but a provided value must be a Bangladesh mobile.
    if (formData.phone?.trim() && !isValidBangladeshPhone(formData.phone)) {
      errs.phone = BD_PHONE_MESSAGE;
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      // Field-level messages are shown inline; the toast names the problems
      // instead of a generic "fix the form" message.
      return showError(Object.values(errs).filter(Boolean).join(" "));
    }
    setFieldErrors({});

    try {
      const url = patient
        ? API_ROUTES.PATIENTS.UPDATE(patient.id)
        : API_ROUTES.PATIENTS.CREATE;

      // Send only fields the patient API accepts, and omit optional enum
      // values when unset — an empty string is NOT a valid bloodGroup and made
      // the backend reject the whole form.
      const payload = {
        name: formData.name.trim(),
        age: formData.age,
        gender: formData.gender,
        // Canonical domestic form (+8801712345678 -> 01712345678).
        phone: formData.phone?.trim()
          ? normalizeBangladeshPhone(formData.phone)
          : undefined,
        bloodGroup: formData.bloodGroup || undefined,
      };

      const res: any = await savePatient(url, payload);
      const saved: Patient | null = res?.data ?? res ?? null;
      success(`Patient record ${patient ? "updated" : "created"} successfully`);
      onSuccess?.(saved);
      onClose();
    } catch {
      // The mutation's onError already surfaced the message; keep the form open
      // with the entered values so the user can correct and retry.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-xs"
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
            <span>{patient ? "Edit Patient Details" : "Register New Patient"}</span>
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
              placeholder="Patient name"
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
                placeholder="01XXXXXXXXX"
                value={formData.phone || ""}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={fieldErrors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors.phone}
                </p>
              )}
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

          {/* Actions */}
          <div className="flex gap-3 mt-6 border-t border-outline-variant pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
