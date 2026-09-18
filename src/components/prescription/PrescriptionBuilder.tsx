"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Search, ChevronDown, Loader2, Check, UserPlus } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { toast as globalToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Prescription, PrescriptionMedicine, Chamber, Patient } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PrescriptionBuilderProps {
  prescription?: Prescription | null;
  onClose: () => void;
  onSaved?: () => void;
}

interface MedRow extends PrescriptionMedicine {
  _id: number;
}

const emptyMed = (id: number): MedRow => ({
  _id: id,
  brandName: "",
  generic: "",
  strength: "",
  type: "Tablet",
  frequency: "1+1+1+0",
  duration: "7 days",
  mealTiming: "AFTER_MEAL",
  instruction: "",
});

// ── PatientSearchCombobox ────────────────────────────────────────────────────

function PatientSearchCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRecentPatients = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.PATIENTS.LIST, {
        signal: controller.signal,
      });
      const list = res.data?.data || res.data || [];
      setResults(Array.isArray(list) ? list.slice(0, 8) : []);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setResults([]);
    }
    setSearching(false);
  };

  const search = async (q: string) => {
    if (!q.trim()) {
      fetchRecentPatients();
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    try {
      const res = await apiClient.get<any>(
        `${API_ROUTES.PATIENTS.SEARCH}?q=${encodeURIComponent(q)}&limit=8`,
        { signal: controller.signal },
      );
      const list = res.data?.data || res.data || [];
      setResults(Array.isArray(list) ? list : []);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setResults([]);
    }
    setSearching(false);
  };

  const handleFocus = () => {
    setOpen(true);
    if (results.length === 0) fetchRecentPatients();
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (p: Patient) => {
    onChange(p.id, p.name);
    setSelectedName(p.name);
    setQuery(p.name);
    setOpen(false);
  };

  const handleQuickAddPatient = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const res = await apiClient.post<any>(API_ROUTES.PATIENTS.CREATE, {
        name: query.trim(),
        age: 30,
        gender: "MALE",
      });
      const newPatient: Patient = res.data?.data || res.data;
      if (newPatient && newPatient.id) {
        handleSelect(newPatient);
      }
    } catch (e: any) {
      globalToast({
        title: "Registration Error",
        description: e?.response?.data?.message || "Failed to create patient",
        variant: "destructive",
      });
    }
    setCreating(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Patient *</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
        <Input
          className="pl-9 pr-8"
          placeholder="Search or type new patient name…"
          value={query}
          onChange={handleQueryChange}
          onFocus={handleFocus}
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
      </div>

      {value && (
        <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
          <Check className="h-3 w-3" /> Selected: {selectedName}
        </p>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-outline-variant rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-surface-container transition-colors border-b border-outline-variant/30 last:border-0"
              onClick={() => handleSelect(p)}
            >
              <p className="text-sm font-semibold text-on-surface">{p.name}</p>
              <p className="text-xs text-on-surface-variant">{p.phone || "No phone"} • {p.gender}</p>
            </button>
          ))}

          {query.trim() && (
            <button
              type="button"
              onClick={handleQuickAddPatient}
              disabled={creating}
              className="w-full text-left px-4 py-3 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center gap-2 transition-colors border-t border-outline-variant"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              <span>+ Quick Add &quot;{query.trim()}&quot; as New Patient</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Chamber (optional)</label>
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
  onChange,
  onRemove,
}: {
  med: MedRow;
  index: number;
  onChange: (i: number, f: keyof MedRow, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSug, setShowSug] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">Medicine #{index + 1}</span>
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
    </div>
  );
}

// ── Main PrescriptionBuilder Component ─────────────────────────────────────────

export default function PrescriptionBuilder({
  prescription,
  onClose,
  onSaved,
}: PrescriptionBuilderProps) {
  const { success, error: showError } = useNotification();
  const [patientId, setPatientId] = useState(prescription?.patientId || "");
  const [chamberId, setChamberId] = useState(prescription?.chamberId || "");
  const [complaints, setComplaints] = useState(prescription?.complaints || "");
  const [diagnosis, setDiagnosis] = useState(prescription?.diagnosis || "General Consultation");
  const [clinicalNotes, setClinicalNotes] = useState(prescription?.clinicalNotes || "");
  const [advises, setAdvises] = useState(prescription?.advises || "");
  const [nextVisit, setNextVisit] = useState(prescription?.nextVisitDate || "");
  const [status, setStatus] = useState<"DRAFT" | "FINALIZED">(
    (prescription?.status as "DRAFT" | "FINALIZED") || "DRAFT"
  );
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    height: "",
  });
  const [meds, setMeds] = useState<MedRow[]>(
    prescription?.medicines?.length
      ? prescription.medicines.map((m, i) => ({ ...m, _id: i }))
      : [emptyMed(0)]
  );
  const [saving, setSaving] = useState(false);
  const medCounter = useRef(meds.length);

  const addMed = () => {
    medCounter.current += 1;
    setMeds((prev) => [...prev, emptyMed(medCounter.current)]);
  };

  const removeMed = (i: number) => setMeds((prev) => prev.filter((_, idx) => idx !== i));

  const changeMed = (i: number, f: keyof MedRow, v: string) =>
    setMeds((prev) => prev.map((m, idx) => idx === i ? { ...m, [f]: v } : m));

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!patientId || patientId.trim() === "") {
      errs.patientId = "Please search and select a patient from the list or click Quick Add";
    }
    if (!diagnosis.trim()) {
      errs.diagnosis = "Diagnosis is required";
    }
    if (meds.length === 0 || !meds[0]?.brandName.trim()) {
      errs.medicines = "At least one medicine with a brand name is required";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return showError("Please fix form validation errors shown below");
    }
    setFieldErrors({});

    setSaving(true);
    const validChamberId = chamberId && chamberId.trim() !== "" ? chamberId.trim() : undefined;

    const formattedMedicines = meds
      .filter((m) => m.brandName.trim())
      .map(({ _id, ...m }) => ({
        brandName: m.brandName.trim(),
        generic: m.generic?.trim() || m.brandName.trim(),
        type: m.type?.trim() || "Tablet",
        usageType: ["DAILY", "TOPICAL", "WEEKLY", "CUSTOM"].includes((m.usageType as string) || "")
          ? (m.usageType as any)
          : "DAILY",
        duration: m.duration?.trim() || "7 days",
        strength: m.strength?.trim() || undefined,
        dosagePattern: m.dosagePattern?.trim() || m.frequency?.trim() || "1+0+1",
        frequency: m.frequency?.trim() || undefined,
        mealTiming: ["BEFORE_MEAL", "AFTER_MEAL", "WITH_MEAL", "AFTER_FULL_MEAL", "EMPTY_STOMACH"].includes((m.mealTiming as string) || "")
          ? (m.mealTiming as any)
          : "AFTER_MEAL",
        instruction: m.instruction?.trim() || undefined,
      }));

    const payload = {
      patientId,
      chamberId: validChamberId,
      complaints: complaints.trim() || undefined,
      diagnosis: diagnosis.trim(),
      clinicalNotes: clinicalNotes.trim() || undefined,
      advises: advises.trim() || undefined,
      nextVisitDate: nextVisit || undefined,
      status,
      bloodPressure: vitals.bloodPressure?.trim() || undefined,
      pulse: vitals.pulse?.trim() || undefined,
      temperature: vitals.temperature?.trim() || undefined,
      weight: vitals.weight ? Number(vitals.weight) : undefined,
      height: vitals.height?.trim() || undefined,
      medicines: formattedMedicines,
    };

    try {
      if (prescription?.id) {
        await apiClient.patch(API_ROUTES.PRESCRIPTIONS.UPDATE(prescription.id), payload);
      } else {
        await apiClient.post(API_ROUTES.PRESCRIPTIONS.CREATE, payload);
      }
      success(`Prescription ${prescription ? "updated" : "created"} successfully`);
      onSaved?.();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save prescription";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl border border-outline-variant z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container/60 sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              {prescription ? "Edit Prescription" : "New Prescription"}
            </h2>
            <p className="text-xs text-on-surface-variant">Fill details and add medicines</p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <PatientSearchCombobox
                value={patientId}
                onChange={(id) => {
                  setPatientId(id);
                  setFieldErrors((e) => ({ ...e, patientId: "" }));
                }}
              />
              {fieldErrors.patientId && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors.patientId}
                </p>
              )}
            </div>
            <ChamberSelect value={chamberId} onChange={setChamberId} />
          </div>

          <div className="rounded-xl border border-outline-variant p-4 bg-surface-container/30">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Vital Signs (optional)</h3>
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
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Chief Complaints</label>
              <Textarea rows={2} placeholder="Patient's main complaints…" value={complaints} onChange={(e) => setComplaints(e.target.value)} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Clinical Notes</label>
                <Textarea rows={2} placeholder="Lab findings, notes…" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Advice</label>
                <Textarea rows={2} placeholder="Lifestyle advice, follow-up…" value={advises} onChange={(e) => setAdvises(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Next Visit Date</label>
                <Input type="date" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "DRAFT" | "FINALIZED")}
                    className="w-full h-10 pl-3 pr-8 text-sm bg-surface border border-gray-200 dark:border-slate-800 rounded-lg text-on-surface appearance-none focus:outline-none"
                  >
                    <option value="DRAFT">Save as Draft</option>
                    <option value="FINALIZED">Finalize</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-on-surface">Medicines *</h3>
              <Button type="button" variant="outline" size="sm" onClick={addMed}>
                <Plus size={14} className="mr-1" /> Add Medicine
              </Button>
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
                  onChange={changeMed}
                  onRemove={removeMed}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-outline-variant">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {saving ? "Saving…" : prescription ? "Update Prescription" : "Create Prescription"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
