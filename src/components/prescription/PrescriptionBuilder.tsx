"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Search, ChevronDown, ChevronRight, Loader2, Check, AlertTriangle } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { useEntitlements } from "@/hooks/useEntitlements";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Prescription, PrescriptionMedicine } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AppointmentVisitPicker from "@/components/appointment/AppointmentVisitPicker";
import PatientCombobox from "@/components/patient/PatientCombobox";
import PatientFormDialog from "@/components/patient/PatientFormDialog";

interface PrescriptionBuilderProps {
  prescription?: Prescription | null;
  onClose: () => void;
  onSaved?: () => void;
  /** Called after a prescription is finalized so the caller can open the preview/print view. */
  onFinalized?: (prescription: { id: string; status: string } & Record<string, any>) => void;
}

interface MedRow extends PrescriptionMedicine {
  _id: number;
}

/** One investigation row. Only the test name is required. */
interface InvestigationRow {
  _id: number;
  testName: string;
  note: string;
}

/** On Examination fields, in display order. Labels are medical shorthand. */
const EXAM_FIELDS: Array<{ key: string; label: string }> = [
  { key: "examRespiratoryRate", label: "R/R" },
  { key: "examLungs", label: "Lungs" },
  { key: "examHeart", label: "Heart" },
  { key: "examAnaemia", label: "Anaemia" },
  { key: "examCyanosis", label: "Cyanosis" },
  { key: "examOedema", label: "Oedema" },
  { key: "examDehydration", label: "Dehydration" },
  { key: "examOthers", label: "Others" },
];

/**
 * Predefined "Special Instruction" options for a medicine line, plus a free-text
 * Custom… entry. Mirrors the backend list in
 * `backend/src/utils/prescription/language.ts` — keep both in sync so the
 * predefined values localise correctly on a Bangla prescription.
 */
const SPECIAL_INSTRUCTION_OPTIONS: string[] = [
  "Take with plenty of water",
  "Take on an empty stomach",
  "Take with food",
  "Do not take with milk",
  "Complete the full course",
  "Do not crush or chew",
  "Take at bedtime",
  "Avoid alcohol",
  "Shake well before use",
  "Apply thinly to the affected area",
  "For external use only",
  "Keep out of reach of children",
];

/** Sentinel value for the "Custom…" option in the Special Instruction picker. */
const CUSTOM_INSTRUCTION = "__custom__";

const emptyExam = () => ({
  examRespiratoryRate: "",
  examLungs: "",
  examHeart: "",
  examAnaemia: "",
  examCyanosis: "",
  examOedema: "",
  examDehydration: "",
  examOthers: "",
});

const emptyMed = (id: number): MedRow => ({
  _id: id,
  brandName: "",
  generic: "",
  strength: "",
  type: "Tablet",
  usageType: "DAILY",
  frequency: "1+1+1+0",
  duration: "7 days",
  mealTiming: "AFTER_MEAL",
  instruction: "",
});


// ── ChamberSelect ─────────────────────────────────────────────────────────────

function ChamberSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [chambers, setChambers] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get<any>(API_ROUTES.CHAMBERS.LIST)
      .then((r) => setChambers(r.data?.data || r.data || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Chamber *</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 pl-3 pr-8 text-sm bg-surface border border-gray-200 dark:border-slate-800 rounded-lg text-on-surface appearance-none focus:outline-none"
        >
          <option value="">No chamber selected</option>
          {chambers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.chamberName || c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
      </div>
    </div>
  );
}

// ── DosageCheckboxPicker ─────────────────────────────────────────────────────

function DosageCheckboxPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (newFreq: string) => void;
}) {
  const parse = (val: string) => {
    if (!val) return ["1", "1", "1", "0"];
    const parts = val.split("+").map((s) => s.trim());
    if (parts.length >= 3) {
      return [
        parts[0] || "0",
        parts[1] || "0",
        parts[2] || "0",
        parts[3] || "0",
      ];
    }
    return ["1", "1", "1", "0"];
  };

  const [doses, setDoses] = useState<string[]>(() => parse(value));

  useEffect(() => {
    setDoses(parse(value));
  }, [value]);

  const updateSlot = (idx: number, val: string) => {
    const next = [...doses];
    next[idx] = val;
    setDoses(next);
    onChange(`${next[0] || "0"}+${next[1] || "0"}+${next[2] || "0"}+${next[3] || "0"}`);
  };

  const toggleCheck = (idx: number) => {
    const currentVal = doses[idx];
    const isZero = currentVal === "0" || currentVal === "" || currentVal === "0.0";
    const nextVal = isZero ? "1" : "0";
    updateSlot(idx, nextVal);
  };

  const titles = ["Morning (সকাল)", "Noon (দুপুর)", "Evening (সন্ধ্যা)", "Night (রাত)"];

  return (
    <div>
      <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
        Dosage / Frequency *
      </label>
      <div className="flex items-center justify-between h-8 mt-0.5 px-2 bg-surface border border-gray-200 dark:border-slate-800 rounded-md text-xs font-semibold text-on-surface">
        {[0, 1, 2, 3].map((i) => {
          const rawVal = doses[i] ?? "0";
          const isChecked = rawVal !== "0" && rawVal !== "" && rawVal !== "0.0";
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-on-surface-variant/40 font-bold select-none">+</span>}
              <div className="flex items-center gap-1" title={titles[i]}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(i)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary accent-primary cursor-pointer focus:ring-0 focus:outline-none"
                />
                <input
                  type="text"
                  value={rawVal}
                  onChange={(e) => updateSlot(i, e.target.value)}
                  className={`w-5 h-6 text-center bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 text-xs font-bold transition-colors ${
                    isChecked ? "text-primary font-bold" : "text-on-surface-variant/50"
                  }`}
                  placeholder="0"
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── DurationPicker ────────────────────────────────────────────────────────────

function DurationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (newDuration: string) => void;
}) {
  const parse = (val: string) => {
    if (!val) return { num: "7", unit: "Days" };
    const parts = val.trim().split(/\s+/);
    const num = parts[0] || "7";
    const rawUnit = parts[1]?.toLowerCase() || "days";
    let unit = "Days";
    if (rawUnit.startsWith("week")) unit = "Weeks";
    else if (rawUnit.startsWith("month")) unit = "Months";
    return { num, unit };
  };

  const [num, setNum] = useState(() => parse(value).num);
  const [unit, setUnit] = useState(() => parse(value).unit);

  useEffect(() => {
    const parsed = parse(value);
    setNum(parsed.num);
    setUnit(parsed.unit);
  }, [value]);

  const handleNumChange = (n: string) => {
    setNum(n);
    onChange(`${n.trim()} ${unit}`);
  };

  const handleUnitChange = (u: string) => {
    setUnit(u);
    onChange(`${num.trim()} ${u}`);
  };

  return (
    <div>
      <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
        Duration *
      </label>
      <div className="flex items-center h-8 mt-0.5 border border-gray-200 dark:border-slate-800 rounded-md overflow-hidden bg-surface">
        <Input
          type="number"
          min="1"
          value={num}
          onChange={(e) => handleNumChange(e.target.value)}
          className="h-full border-0 focus-visible:ring-0 rounded-none flex-1 px-2.5 text-xs font-semibold text-on-surface"
          placeholder="7"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="h-full bg-surface-container/70 border-l border-gray-200 dark:border-slate-800 px-2 text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
        >
          <option value="Days">Days</option>
          <option value="Weeks">Weeks</option>
          <option value="Months">Months</option>
        </select>
      </div>
    </div>
  );
}

// ── MedicineRow ───────────────────────────────────────────────────────────────

function MedicineRow({
  med,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  med: MedRow;
  index: number;
  /** Only one medicine card is open at a time. */
  expanded: boolean;
  onToggle: () => void;
  onChange: (i: number, f: keyof MedRow, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSug, setShowSug] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const usageType = (med.usageType || "DAILY") as string;
  // An existing note that is not one of the predefined options is doctor text —
  // show it in the Custom input instead of the picker.
  const [customInstruction, setCustomInstruction] = useState(
    Boolean(med.notes && !SPECIAL_INSTRUCTION_OPTIONS.includes(med.notes)),
  );

  const searchMed = async (q: string) => {
    // Abort any in-flight request so a slow earlier response cannot overwrite
    // the results for the latest keystroke.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await apiClient.get<any>(
        `${API_ROUTES.MEDICINES.SEARCH}?q=${encodeURIComponent(q)}&limit=6`,
        { signal: controller.signal },
      );
      const list = res.data?.data || res.data || [];
      setSuggestions(Array.isArray(list) ? list : []);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setSuggestions([]);
    }
  };

  const handleBrandChange = (v: string) => {
    onChange(index, "brandName", v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchMed(v), 300);
    setShowSug(true);
  };

  // Empty-state: surface the doctor's frequently used medicines before typing.
  const handleBrandFocus = () => {
    setShowSug(true);
    if (!med.brandName?.trim()) {
      searchMed("");
    }
  };

  const selectSuggestion = (s: any) => {
    onChange(index, "brandName", s.brandName || "");
    onChange(index, "generic", s.generic || s.genericName || s.brandName || "");
    onChange(index, "strength", s.strength || "");
    onChange(index, "type", s.dosageForm || s.form || s.type || "Tablet");
    setSuggestions([]);
    setShowSug(false);
  };

  const field = (label: string, key: keyof MedRow, placeholder = "") => (
    <div>
      <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      <Input
        value={String((med as any)[key] || "")}
        onChange={(e) => onChange(index, key, e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs mt-0.5"
      />
    </div>
  );

  return (
    <div className="border border-outline-variant rounded-xl p-4 bg-surface-container/40 relative space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="text-xs font-bold text-primary">Medicine #{index + 1}</span>
          {!expanded && (
            <span className="truncate text-xs text-on-surface-variant">
              {med.brandName?.trim()
                ? `${med.brandName}${med.strength ? ` ${med.strength}` : ""}`
                : "New medicine — click to fill"}
            </span>
          )}
          {expanded ? (
            <ChevronDown size={14} className="ml-auto shrink-0 text-on-surface-variant" />
          ) : (
            <ChevronRight size={14} className="ml-auto shrink-0 text-on-surface-variant" />
          )}
        </button>
        {index > 0 && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="h-7 w-7 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {expanded && (
      <>
      <div className="relative">
        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Brand Name *</label>
        <div className="relative mt-0.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
          <Input
            value={med.brandName}
            onChange={(e) => handleBrandChange(e.target.value)}
            onFocus={handleBrandFocus}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
            placeholder="e.g. Napa, Fexo…"
            className="h-8 text-xs pl-8"
          />
        </div>
        {showSug && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-surface border border-outline-variant rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((s, si) => (
              <button
                key={s.id || si}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-surface-container transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
              >
                <p className="text-xs font-semibold text-on-surface">{s.brandName}</p>
                <p className="text-[10px] text-on-surface-variant">
                  {[s.generic || s.genericName, s.strength, s.dosageForm || s.form]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {field("Generic", "generic", "Paracetamol")}
        {field("Strength", "strength", "500mg")}
        {field("Type", "type", "Tablet")}
        <div>
          <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Schedule Type</label>
          <select
            value={usageType}
            onChange={(e) => onChange(index, "usageType", e.target.value)}
            className="w-full h-8 px-2 text-xs bg-surface border border-gray-200 dark:border-slate-800 rounded-md text-on-surface mt-0.5 focus:outline-none"
          >
            <option value="DAILY">Tablet / Oral</option>
            <option value="WEEKLY">Weekly / Interval</option>
            <option value="TOPICAL">Topical</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {usageType === "DAILY" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          <DosageCheckboxPicker
            value={med.frequency || "1+1+1+0"}
            onChange={(newFreq) => onChange(index, "frequency", newFreq)}
          />
          <DurationPicker
            value={med.duration || "7 Days"}
            onChange={(newDur) => onChange(index, "duration", newDur)}
          />
          <div>
            <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Meal Timing</label>
            <select
              value={med.mealTiming || "AFTER_MEAL"}
              onChange={(e) => onChange(index, "mealTiming", e.target.value)}
              className="w-full h-8 px-2 text-xs bg-surface border border-gray-200 dark:border-slate-800 rounded-md text-on-surface mt-0.5 focus:outline-none"
            >
              <option value="AFTER_MEAL">After Meal</option>
              <option value="BEFORE_MEAL">Before Meal</option>
              <option value="WITH_MEAL">With Meal</option>
              <option value="EMPTY_STOMACH">Empty Stomach</option>
            </select>
          </div>
        </div>
      )}

      {usageType === "WEEKLY" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {field("Dose", "dose", "Apply once")}
          {field("Interval (days)", "intervalDays", "7")}
          <DurationPicker
            value={med.duration || "4 weeks"}
            onChange={(newDur) => onChange(index, "duration", newDur)}
          />
        </div>
      )}

      {usageType === "TOPICAL" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {field("Amount", "applicationAmount", "Thin layer")}
          {field("Area", "applicationArea", "Affected area")}
          {field("Frequency", "applicationFrequency", "Twice daily")}
          <DurationPicker
            value={med.duration || "7 Days"}
            onChange={(newDur) => onChange(index, "duration", newDur)}
          />
        </div>
      )}

      {usageType === "CUSTOM" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {field("Custom schedule", "instruction", "Day 1: 1 dose, Day 2: 1 dose, Day 3: none")}
          <DurationPicker
            value={med.duration || "7 Days"}
            onChange={(newDur) => onChange(index, "duration", newDur)}
          />
        </div>
      )}

      {/* Special Instruction — a predefined picker plus a free-text "Custom…"
          entry. Persisted on the medicine's `notes` column and printed under the
          medicine line. */}
      <div>
        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Special Instruction</label>
        <select
          value={customInstruction ? CUSTOM_INSTRUCTION : med.notes || ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value === CUSTOM_INSTRUCTION) {
              setCustomInstruction(true);
              onChange(index, "notes", "");
            } else {
              setCustomInstruction(false);
              onChange(index, "notes", value);
            }
          }}
          className="w-full h-8 px-2 text-xs mt-0.5 bg-surface border border-gray-200 dark:border-slate-800 rounded-md text-on-surface focus:outline-none"
        >
          <option value="">None</option>
          {SPECIAL_INSTRUCTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={CUSTOM_INSTRUCTION}>Custom…</option>
        </select>
        {customInstruction && (
          <Input
            value={med.notes || ""}
            onChange={(e) => onChange(index, "notes", e.target.value)}
            placeholder="Custom special instruction…"
            className="h-8 text-xs mt-1.5"
          />
        )}
      </div>
      </>
      )}
    </div>
  );
}

// ── Main PrescriptionBuilder Component ─────────────────────────────────────────

export default function PrescriptionBuilder({
  prescription,
  onClose,
  onSaved,
  onFinalized,
}: PrescriptionBuilderProps) {
  const { success, error: showError } = useNotification();
  const [patientId, setPatientId] = useState(prescription?.patientId || "");
  const [chamberId, setChamberId] = useState(
    // New prescriptions default to the chamber chosen in the sidebar switcher;
    // editing keeps the chamber the prescription was created with.
    prescription?.chamberId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("activeChamberId") || ""
        : ""),
  );
  // Visit eligibility — only relevant in CHAMBER/INSTITUTION context.
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceType, setWorkspaceType] = useState("PERSONAL");
  const [appointmentId, setAppointmentId] = useState("");
  const [visitEligible, setVisitEligible] = useState(true);
  // Personal workspaces have no appointments, so the patient is either picked
  // from the search or created through the shared full patient form.
  const [showNewPatient, setShowNewPatient] = useState(false);
  // Name of a patient created through the full form, so the field can show it.
  const [patientLabel, setPatientLabel] = useState("");
  const [complaints, setComplaints] = useState(prescription?.complaints || "");
  const [diagnosis, setDiagnosis] = useState(prescription?.diagnosis || "");
  // "Instructions" — the form's single free-text instruction field. It reuses
  // the existing `clinicalNotes` column, which the PDF already prints under the
  // "Instructions" heading (see the prescription templates).
  const [instructions, setInstructions] = useState(
    prescription?.clinicalNotes || "",
  );
  // Normalize the stored ISO date to the YYYY-MM-DD the date input expects.
  const [nextVisit, setNextVisit] = useState(() => {
    const value = (prescription as any)?.nextVisitDate;
    if (!value) return "";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  });
  // Pre-populate vitals from the latest clinical observation when editing.
  const [vitals, setVitals] = useState(() => {
    const obs = (prescription as any)?.clinicalObservations?.[0];
    return {
      bloodPressure: obs?.bloodPressure ?? "",
      pulse: obs?.pulse != null ? String(obs.pulse) : "",
      temperature: obs?.temperature != null ? String(obs.temperature) : "",
      weight: obs?.weight != null ? String(obs.weight) : "",
      height: obs?.height ?? "",
    };
  });
  // On Examination (O/E) findings — free text, all optional.
  const [exam, setExam] = useState<Record<string, string>>(() => ({
    ...emptyExam(),
    ...Object.fromEntries(
      EXAM_FIELDS.filter(({ key }) => (prescription as any)?.[key]).map(
        ({ key }) => [key, String((prescription as any)[key])],
      ),
    ),
  }));
  // Relevant past medical history (separate from chief complaints).
  const [history, setHistory] = useState(prescription?.history || "");
  const [investigations, setInvestigations] = useState<InvestigationRow[]>(() =>
    (prescription?.investigations || []).map((inv, i) => ({
      _id: i,
      testName: inv.testName || "",
      note: inv.note || "",
    })),
  );
  const invCounter = useRef((prescription?.investigations || []).length);
  const [meds, setMeds] = useState<MedRow[]>(
    prescription?.medicines?.length
      ? prescription.medicines.map((m, i) => ({ ...m, _id: i }))
      : [emptyMed(0)]
  );
  const [saving, setSaving] = useState(false);
  const medCounter = useRef(meds.length);
  const submittingRef = useRef(false);
  // Only one medicine card is expanded at a time — the one being filled in.
  const [expandedMedId, setExpandedMedId] = useState<number | null>(
    meds[0]?._id ?? null,
  );

  const addMed = () => {
    medCounter.current += 1;
    const row = emptyMed(medCounter.current);
    setMeds((prev) => [...prev, row]);
    // Collapse the previously open card and open the newly added one.
    setExpandedMedId(row._id);
  };

  const removeMed = (i: number) => {
    const removedId = meds[i]?._id;
    const next = meds.filter((_, idx) => idx !== i);
    setMeds(next);
    if (removedId != null && expandedMedId === removedId) {
      setExpandedMedId(next[0]?._id ?? null);
    }
  };

  const changeMed = (i: number, f: keyof MedRow, v: string) => {
    setMeds((prev) => prev.map((m, idx) => (idx === i ? { ...m, [f]: v } : m)));
    // Clear a stale "medicine required" error as soon as a medicine is filled
    // in, instead of leaving it visible until the next submit.
    if (f === "brandName" && v.trim()) {
      setFieldErrors((errs) =>
        errs.medicines ? { ...errs, medicines: "" } : errs,
      );
    }
  };

  const addInvestigation = () => {
    invCounter.current += 1;
    setInvestigations((prev) => [
      ...prev,
      { _id: invCounter.current, testName: "", note: "" },
    ]);
  };

  const removeInvestigation = (i: number) =>
    setInvestigations((prev) => prev.filter((_, idx) => idx !== i));

  const changeInvestigation = (
    i: number,
    field: "testName" | "note",
    value: string,
  ) =>
    setInvestigations((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)),
    );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitSaving, setExitSaving] = useState(false);

  // Build the API payload. Autosave always targets DRAFT (Section 13.5); the
  // manual submit saves a DRAFT then finalizes it through the finalize endpoint.
  // `patientIdOverride` is used when a Personal-workspace patient is created
  // from the typed name during submit.
  const buildPayload = (
    targetStatus: "DRAFT" | "FINALIZED",
    patientIdOverride?: string,
  ) => {
    const formattedMedicines = meds
      .filter((m) => m.brandName.trim())
      .map(({ _id, ...m }) => {
        const usageType = ["DAILY", "TOPICAL", "WEEKLY", "CUSTOM"].includes(
          (m.usageType as string) || "",
        )
          ? (m.usageType as "DAILY" | "TOPICAL" | "WEEKLY" | "CUSTOM")
          : "DAILY";
        const intervalDays =
          m.intervalDays !== undefined && String(m.intervalDays).trim() !== ""
            ? Number(m.intervalDays)
            : undefined;
        const instruction = m.instruction?.trim() || undefined;

        return {
          brandName: m.brandName.trim(),
          generic: m.generic?.trim() || m.brandName.trim(),
          type: m.type?.trim() || "Tablet",
          usageType,
          duration: m.duration?.trim() || "7 days",
          strength: m.strength?.trim() || undefined,
          dosagePattern: m.dosagePattern?.trim() || m.frequency?.trim() || "1+0+1",
          frequency: m.frequency?.trim() || undefined,
          mealTiming:
            usageType === "DAILY" &&
            ["BEFORE_MEAL", "AFTER_MEAL", "WITH_MEAL", "AFTER_FULL_MEAL", "EMPTY_STOMACH"].includes(
              (m.mealTiming as string) || "",
            )
              ? (m.mealTiming as any)
              : undefined,
          instruction,
          // Per-medicine note shown on the "Special Instruction" input and
          // printed under the medicine line.
          notes: m.notes?.trim() || undefined,
          dose: m.dose?.trim() || undefined,
          intervalDays: usageType === "WEEKLY" ? intervalDays : undefined,
          applicationAmount: m.applicationAmount?.trim() || undefined,
          applicationArea: m.applicationArea?.trim() || undefined,
          applicationFrequency: m.applicationFrequency?.trim() || undefined,
          customScheduleJson:
            usageType === "CUSTOM" && instruction
              ? { schedule: instruction }
              : undefined,
        };
      });

    return {
      patientId: patientIdOverride ?? patientId,
      appointmentId: appointmentId || undefined,
      chamberId: chamberId && chamberId.trim() !== "" ? chamberId.trim() : undefined,
      complaints: complaints.trim() || undefined,
      diagnosis: diagnosis.trim(),
      // Instructions — stored on the existing `clinicalNotes` column.
      clinicalNotes: instructions.trim() || undefined,
      nextVisitDate: nextVisit || undefined,
      // Optional clinical additions — all free text, all optional.
      history: history.trim() || undefined,
      examRespiratoryRate: exam.examRespiratoryRate?.trim() || undefined,
      examLungs: exam.examLungs?.trim() || undefined,
      examHeart: exam.examHeart?.trim() || undefined,
      examAnaemia: exam.examAnaemia?.trim() || undefined,
      examCyanosis: exam.examCyanosis?.trim() || undefined,
      examOedema: exam.examOedema?.trim() || undefined,
      examDehydration: exam.examDehydration?.trim() || undefined,
      examOthers: exam.examOthers?.trim() || undefined,
      investigations: investigations.filter((inv) => inv.testName.trim()).length
        ? investigations
            .filter((inv) => inv.testName.trim())
            .map((inv) => ({
              testName: inv.testName.trim(),
              note: inv.note.trim() || undefined,
            }))
        : undefined,
      status: targetStatus,
      bloodPressure: vitals.bloodPressure?.trim() || undefined,
      pulse: vitals.pulse?.trim() || undefined,
      temperature: vitals.temperature?.trim() || undefined,
      weight: vitals.weight ? Number(vitals.weight) : undefined,
      height: vitals.height?.trim() || undefined,
      medicines: formattedMedicines,
    };
  };

  // Snapshot of all editable fields, used to detect dirty state.
  const formSnapshot = JSON.stringify({
    patientId,
    chamberId,
    complaints,
    diagnosis,
    instructions,
    nextVisit,
    vitals,
    exam,
    history,
    investigations: investigations.map(({ _id, ...row }) => row),
    meds: meds.map(({ _id, ...m }) => m),
  });

  // Debounced autosave for existing drafts. Never autosaves a finalized
  // prescription (locked) or a brand-new one (no id yet). On failure the
  // local form state is preserved and an "unsaved" state is shown.
  useEffect(() => {
    if (lastSavedRef.current === null) {
      lastSavedRef.current = formSnapshot;
      return;
    }
    if (formSnapshot === lastSavedRef.current) return;

    if (!prescription?.id || prescription.status === "FINALIZED") {
      setSaveState("dirty");
      return;
    }

    setSaveState("dirty");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await apiClient.patch(
          API_ROUTES.PRESCRIPTIONS.UPDATE(prescription.id),
          buildPayload("DRAFT"),
        );
        lastSavedRef.current = formSnapshot;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 1500);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSnapshot]);

  // ── Exit handling (save as draft / discard) ─────────────────────────────────
  // Closing the builder should never silently discard work. If there are
  // unsaved changes we ask whether to keep a draft or discard it.
  const requestClose = () => {
    if (saving || exitSaving) return;
    // Compare against the last persisted snapshot. Read in the handler (not
    // during render) to avoid touching a ref while rendering.
    const isDirty = formSnapshot !== lastSavedRef.current;
    if (!isDirty) {
      onClose();
      return;
    }
    setShowExitDialog(true);
  };

  // The patient must be chosen explicitly: either an existing patient from the
  // search, or one created through the shared FULL patient form. There is no
  // name-only fallback — that produced incomplete patient records.
  const resolvePatientId = async (): Promise<string | null> => patientId || null;

  const saveDraftAndExit = async () => {
    if (submittingRef.current || exitSaving) return;

    // A chamber is only required outside a Personal workspace.
    if (workspaceType !== "PERSONAL" && !chamberId) {
      return showError("Select a chamber before saving a draft");
    }
    if (!meds.some((m) => m.brandName.trim())) {
      return showError("Add at least one medicine before saving a draft");
    }
    // A new prescription in chamber/institution context still needs an
    // eligible visit even when saved as a draft (backend enforces this too).
    if (!prescription?.id && workspaceType !== "PERSONAL" && !appointmentId) {
      return showError("Select a paid or free appointment before saving a draft");
    }

    submittingRef.current = true;
    setExitSaving(true);
    try {
      const rxPatientId = await resolvePatientId();
      if (!rxPatientId) {
        return showError("Enter the patient's name before saving a draft");
      }
      if (prescription?.id) {
        await apiClient.patch(
          API_ROUTES.PRESCRIPTIONS.UPDATE(prescription.id),
          buildPayload("DRAFT", rxPatientId),
        );
      } else {
        await apiClient.post(
          API_ROUTES.PRESCRIPTIONS.CREATE,
          buildPayload("DRAFT", rxPatientId),
        );
      }
      lastSavedRef.current = formSnapshot;
      setSaveState("saved");
      success("Prescription saved as draft");
      setShowExitDialog(false);
      onSaved?.();
      onClose();
    } catch (e: any) {
      showError(
        e?.response?.data?.message || e?.message || "Failed to save draft",
      );
    } finally {
      submittingRef.current = false;
      setExitSaving(false);
    }
  };

  const discardAndExit = () => {
    setShowExitDialog(false);
    onSaved?.();
    onClose();
  };

  // Resolve the active workspace + its type. In CHAMBER/INSTITUTION context a
  // paid or free visit is required before a prescription can be created.
  useEffect(() => {
    const wsId =
      typeof window !== "undefined"
        ? localStorage.getItem("activeWorkspaceId")
        : null;
    if (wsId) setWorkspaceId(wsId);
    apiClient
      .get<any>(API_ROUTES.WORKSPACES.LIST)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const active = list.find((w: any) => w.id === wsId) || list[0];
        if (active?.id) setWorkspaceId(active.id);
        if (active?.type) setWorkspaceType(active.type);
      })
      .catch(() => {});
  }, []);

  // ── Templates (Section 13.6) ───────────────────────────────────────────────
  const [templates, setTemplates] = useState<any[]>([]);
  // SAVED (reusable) templates have their OWN entitlement — independent of the
  // built-in DESIGN templates and of the prescription language.
  const { isAllowed } = useEntitlements();
  const canUseSavedTemplates = isAllowed("prescription_templates");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    // Don't even ask when the plan does not include saved templates (the API
    // would reject it as well).
    if (!canUseSavedTemplates) {
      setTemplates([]);
      return;
    }
    let active = true;
    apiClient
      .get<any>(API_ROUTES.TEMPLATES.LIST)
      .then((r) => {
        if (active) setTemplates(r.data?.data || r.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canUseSavedTemplates]);

  // Copy a template into the current prescription. The stored template is never
  // mutated by later edits to the prescription.
  const applyTemplate = () => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) return;
    const imported = Array.isArray(tpl.medicinesJson) ? tpl.medicinesJson : [];

    const rows: MedRow[] = imported.map((m: any) => {
      medCounter.current += 1;
      return {
        _id: medCounter.current,
        brandName: m.brandName || "",
        generic: m.generic || "",
        strength: m.strength || "",
        type: m.type || "Tablet",
        usageType: m.usageType || "DAILY",
        dosagePattern: m.dosagePattern,
        frequency: m.frequency,
        duration: m.duration || "7 days",
        mealTiming: m.mealTiming,
        instruction: m.instruction,
        dose: m.dose,
        intervalDays: m.intervalDays,
        applicationAmount: m.applicationAmount,
        applicationArea: m.applicationArea,
        applicationFrequency: m.applicationFrequency,
        customScheduleJson: m.customScheduleJson,
      };
    });

    setMeds((prev) => [...prev.filter((m) => m.brandName.trim()), ...rows]);
    if (!complaints.trim() && tpl.complaints) setComplaints(tpl.complaints);
    // Stored templates may still carry `advises` (kept in the DB for historical
    // records) but the form no longer collects an Advice field.
    success(`Template "${tpl.name}" applied`);
  };

  const saveAsTemplate = async () => {
    const validMeds = meds.filter((m) => m.brandName.trim());
    if (validMeds.length === 0) {
      return showError("Add at least one medicine before saving a template");
    }
    const name = window.prompt("Template name (e.g. Cold & Fever)");
    if (!name || !name.trim()) return;

    try {
      const res = await apiClient.post<any>(API_ROUTES.TEMPLATES.CREATE, {
        name: name.trim(),
        complaints: complaints.trim() || undefined,
        medicines: buildPayload("DRAFT").medicines,
      });
      const created = res.data?.data || res.data;
      setTemplates((prev) => [created, ...prev]);
      success(`Template "${name.trim()}" saved`);
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to save template");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!patientId || patientId.trim() === "") {
      errs.patientId =
        workspaceType === "PERSONAL"
          ? "Select an existing patient or create a new one"
          : "Select a paid or free appointment for this patient";
    }

    // A chamber is only required outside a Personal workspace.
    if (workspaceType !== "PERSONAL" && (!chamberId || chamberId.trim() === "")) {
      errs.chamberId = "Please select a chamber for this prescription";
    }

    // Chamber / institution context requires an eligible (paid or free) visit.
    if (workspaceType !== "PERSONAL") {
      if (!appointmentId) {
        errs.appointmentId =
          "Select a paid or free appointment for today, or create a follow-up visit.";
      } else if (!visitEligible) {
        errs.appointmentId =
          "Payment is incomplete. Prescription cannot be created until the appointment is paid or marked free.";
      }
    }
    if (!diagnosis.trim()) {
      errs.diagnosis = "Diagnosis is required";
    }
    const firstEmptyMed = meds.find((m) => !m.brandName.trim());
    if (meds.length === 0 || firstEmptyMed) {
      errs.medicines = "At least one medicine with a brand name is required";
      // Open the offending card so it can be fixed immediately.
      if (firstEmptyMed) setExpandedMedId(firstEmptyMed._id);
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      // Name the actual problems instead of a generic "fix the form" message.
      // Each message is also shown next to its field.
      return showError(Object.values(errs).filter(Boolean).join(" "));
    }
    setFieldErrors({});

    // Guard against duplicate submissions (double click / Enter + click) that
    // would otherwise create two prescriptions before `saving` re-renders.
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSaving(true);

    try {
      // Personal workspaces resolve the typed patient name into a real Patient
      // record before the prescription is created.
      const rxPatientId = await resolvePatientId();
      if (!rxPatientId) {
        return showError("Enter the patient's name");
      }

      // Save as DRAFT, then finalize through the dedicated endpoint so the
      // verification gate, serial and code are applied. Generating a
      // prescription always finalizes — there is no status choice in the form.
      const payload = buildPayload("DRAFT", rxPatientId);
      let rxId = prescription?.id;
      if (rxId) {
        await apiClient.patch(API_ROUTES.PRESCRIPTIONS.UPDATE(rxId), payload);
      } else {
        const created = await apiClient.post<any>(API_ROUTES.PRESCRIPTIONS.CREATE, payload);
        rxId = created.data?.data?.id || created.data?.id;
      }

      if (!rxId) {
        throw new Error("Prescription could not be saved. Please try again.");
      }

      const fin = await apiClient.post<any>(
        API_ROUTES.PRESCRIPTIONS.FINALIZE(rxId),
      );
      const finalized = fin.data?.data || fin.data;
      // Surface the finalized record so the caller can open the preview/print.
      onFinalized?.({ ...(finalized || {}), id: rxId, status: "FINALIZED" });

      lastSavedRef.current = formSnapshot;
      setSaveState("saved");
      success("Prescription finalized successfully");
      onSaved?.();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save prescription";
      showError(msg);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={requestClose} />
      <div className="relative bg-surface rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl border border-outline-variant z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container/60 sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              {prescription ? "Edit Prescription" : "New Prescription"}
            </h2>
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              {saveState === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check className="h-3 w-3 text-emerald-600" /> All changes saved
                </>
              )}
              {saveState === "error" && (
                <span className="font-semibold text-red-500">
                  Save failed — your changes are kept, edit to retry
                </span>
              )}
              {(saveState === "idle" || saveState === "dirty") &&
                (saveState === "dirty" && prescription?.id
                  ? "Unsaved changes…"
                  : "Fill details and add medicines")}
            </p>
          </div>
          <button type="button" onClick={requestClose} className="h-8 w-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal workspaces have no appointments/chambers: the patient is
              typed by name. Chamber/institution keeps the appointment flow. */}
          <div
            className={`grid gap-4 ${
              workspaceType === "PERSONAL"
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            <div>
              {workspaceType !== "PERSONAL" ? (
                <AppointmentVisitPicker
                  workspaceId={workspaceId}
                  patientId={patientId}
                  appointmentId={appointmentId}
                  required={workspaceType !== "PERSONAL"}
                  onSelect={({ patientId: pid, appointmentId: aid, eligible }) => {
                    setPatientId(pid);
                    setAppointmentId(aid);
                    setVisitEligible(eligible);
                    setFieldErrors((e) => ({
                      ...e,
                      patientId: "",
                      appointmentId: "",
                    }));
                  }}
                />
              ) : (
                <PatientCombobox
                  value={patientId}
                  onChange={(id) => {
                    setPatientId(id);
                    setPatientLabel("");
                    setFieldErrors((e) => ({ ...e, patientId: "" }));
                  }}
                  selectedLabel={patientLabel}
                  // Opens the SAME full patient form used by the Patient page
                  // and the Appointment flow.
                  onNewPatient={() => setShowNewPatient(true)}
                />
              )}
              {fieldErrors.patientId && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors.patientId}
                </p>
              )}
              {fieldErrors.appointmentId && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors.appointmentId}
                </p>
              )}
            </div>
            {workspaceType !== "PERSONAL" && (
              <div>
                <ChamberSelect value={chamberId} onChange={setChamberId} />
                {fieldErrors.chamberId && (
                  <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                    ⚠️ {fieldErrors.chamberId}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* On Examination (O/E) — one optional section holding BOTH the vital
              signs and the examination findings. Free text on purpose: doctors
              write varied shorthand ("Nil", "+", "Mild"). */}
          <div className="rounded-xl border border-outline-variant p-4 bg-surface-container/30">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">On Examination (O/E) (optional)</h3>

            {/* Vital signs (values unchanged — only the section grouping moved). */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {(["bloodPressure", "pulse", "temperature", "weight", "height"] as const).map((f) => (
                <div key={f}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {f === "bloodPressure" ? "BP" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </label>
                  <Input
                    className="h-8 text-xs mt-0.5"
                    value={vitals[f]}
                    onChange={(e) => setVitals((v) => ({ ...v, [f]: e.target.value }))}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {EXAM_FIELDS.filter(({ key }) => key !== "examOthers").map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</label>
                  <Input
                    className="h-8 text-xs mt-0.5"
                    value={exam[key] ?? ""}
                    onChange={(e) => setExam((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            {/* Others is a multi-line catch-all for custom findings. */}
            <div className="mt-3">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">Others</label>
              <Textarea
                rows={2}
                className="text-xs mt-0.5"
                value={exam.examOthers ?? ""}
                onChange={(e) => setExam((prev) => ({ ...prev, examOthers: e.target.value }))}
                placeholder="Other examination findings…"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Chief Complaints</label>
              <Textarea rows={2} placeholder="Patient's main complaints…" value={complaints} onChange={(e) => setComplaints(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">History</label>
              <Textarea rows={2} placeholder="Relevant past medical history..." value={history} onChange={(e) => setHistory(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Diagnosis *</label>
              <Textarea
                rows={2}
                placeholder="Primary diagnosis…"
                value={diagnosis}
                onChange={(e) => {
                  setDiagnosis(e.target.value);
                  setFieldErrors((errs) => ({ ...errs, diagnosis: "" }));
                }}
                className={fieldErrors.diagnosis ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {fieldErrors.diagnosis && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors.diagnosis}
                </p>
              )}
            </div>

            {/* Investigation — repeatable list; only the test name is required
                and an empty list is fine. */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Investigation</label>
              {investigations.length > 0 && (
                <div className="space-y-2">
                  {investigations.map((inv, i) => (
                    <div key={inv._id} className="flex items-center gap-2">
                      <Input
                        className="h-9 flex-1 text-xs"
                        placeholder="Test name (e.g. CBC)"
                        value={inv.testName}
                        onChange={(e) => changeInvestigation(i, "testName", e.target.value)}
                      />
                      <Input
                        className="h-9 flex-1 text-xs"
                        placeholder="Note (optional)"
                        value={inv.note}
                        onChange={(e) => changeInvestigation(i, "note", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeInvestigation(i)}
                        aria-label={`Remove investigation ${i + 1}`}
                        className="h-9 w-9 shrink-0 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInvestigation}
                className="mt-2"
              >
                <Plus size={14} className="mr-1" /> Add Investigation
              </Button>
            </div>

            {/* Instructions — replaces the separate Clinical Notes + Advice
                inputs. Saved on the existing `clinicalNotes` column. */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Instructions</label>
              <Textarea
                rows={3}
                placeholder="Additional instructions for the patient…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
            {/* Status selection removed: generating always finalizes the
                prescription (the draft/discard flow lives in the exit dialog). */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Next Visit Date</label>
              <Input type="date" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-on-surface">Medicines *</h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* The whole saved-template surface (load + save-as-template) is
                    gated by `prescription_templates` only. */}
                {canUseSavedTemplates && templates.length > 0 && (
                  <>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="h-8 px-2 text-xs bg-surface border border-gray-200 dark:border-slate-800 rounded-md text-on-surface focus:outline-none"
                    >
                      <option value="">Load template…</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyTemplate}
                      disabled={!selectedTemplateId}
                    >
                      Apply
                    </Button>
                  </>
                )}
                {canUseSavedTemplates && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={saveAsTemplate}
                  >
                    Save as template
                  </Button>
                )}
              </div>
            </div>
            {fieldErrors.medicines && (
              <p className="text-xs text-red-500 font-semibold mb-2 animate-in fade-in duration-200">
                ⚠️ {fieldErrors.medicines}
              </p>
            )}
            <div className="space-y-3">
              {meds.map((m, i) => (
                <MedicineRow
                  key={m._id}
                  med={m}
                  index={i}
                  expanded={expandedMedId === m._id}
                  // Header button toggles: clicking an open card collapses it.
                  onToggle={() =>
                    setExpandedMedId((current) =>
                      current === m._id ? null : m._id,
                    )
                  }
                  onChange={changeMed}
                  onRemove={removeMed}
                />
              ))}
            </div>

            {/* Sits directly below the medicine cards, per the form layout. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMed}
              className="mt-3 w-full"
            >
              <Plus size={14} className="mr-1" /> Add Medicine
            </Button>
          </div>

          <div className="flex gap-3 pt-2 border-t border-outline-variant">
            <Button type="button" variant="ghost" onClick={requestClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {saving ? "Saving…" : prescription ? "Update Prescription" : "Create Prescription"}
            </Button>
          </div>
        </form>
      </div>

      {showExitDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !exitSaving && setShowExitDialog(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
                className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-on-surface">
                  Save this prescription?
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  You have unsaved changes. Save it as a draft so you can finish
                  it later, or discard it.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowExitDialog(false)}
                disabled={exitSaving}
              >
                Keep editing
              </Button>
              <Button variant="danger" onClick={discardAndExit} disabled={exitSaving}>
                Discard
              </Button>
              <Button
                variant="primary"
                onClick={saveDraftAndExit}
                disabled={exitSaving}
                autoFocus
              >
                {exitSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {exitSaving ? "Saving…" : "Save as Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full patient creation (shared with the Patient page & Appointments).
          The created patient is selected automatically. */}
      {showNewPatient && (
        <PatientFormDialog
          onClose={() => setShowNewPatient(false)}
          onSuccess={(p) => {
            if (p?.id) {
              setPatientId(p.id);
              setPatientLabel(p.name || "");
              setFieldErrors((e) => ({ ...e, patientId: "" }));
            }
            setShowNewPatient(false);
          }}
        />
      )}
    </div>
  );
}
