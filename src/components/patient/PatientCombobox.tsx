"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2, Check, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useDismissable } from "@/hooks/useDismissable";
import { Patient } from "@/types";

interface PatientComboboxProps {
  value: string;
  onChange: (id: string, name: string) => void;
  label?: string;
  placeholder?: string;
  /**
   * Opens the caller's FULL "New Patient" form (the shared
   * PatientFormDialog). There is deliberately no name-only quick-add — a
   * patient must be created with the complete profile.
   */
  onNewPatient?: () => void;
  /**
   * Name to show for a patient selected OUTSIDE the dropdown (e.g. just created
   * through the full patient form), so the field never shows a blank selection.
   */
  selectedLabel?: string;
}

/**
 * Searchable patient picker used by the appointment and prescription flows.
 * Search by name or phone and pick an existing patient; creating a new one
 * opens the caller's full PatientFormDialog via `onNewPatient`.
 */
export default function PatientCombobox({
  value,
  onChange,
  label = "Patient *",
  placeholder = "Search patient by name or phone…",
  onNewPatient,
  selectedLabel,
}: PatientComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close the suggestions on outside click or Escape (shared behaviour).
  useDismissable(containerRef, () => setOpen(false), open);

  // A patient selected OUTSIDE the dropdown (e.g. just created through the
  // shared full patient form) must populate the visible name field and replace
  // any stale internal selection, so the user never has to search again.
  useEffect(() => {
    if (!value || !selectedLabel) return;
    setSelectedName((prev) => (prev === selectedLabel ? prev : selectedLabel));
    setQuery((prev) => (prev === selectedLabel ? prev : selectedLabel));
  }, [value, selectedLabel]);

  const fetchRecent = async () => {
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
    if (!q.trim()) return fetchRecent();
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

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <Input
          className="pl-9 pr-8"
          placeholder={placeholder}
          value={query}
          onChange={handleQueryChange}
          onFocus={() => {
            setOpen(true);
            if (results.length === 0) fetchRecent();
          }}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {value && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Check className="h-3 w-3" /> Selected: {selectedLabel || selectedName}
        </p>
      )}

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-outline-variant bg-surface shadow-xl">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full border-b border-outline-variant/30 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-container"
              onClick={() => handleSelect(p)}
            >
              <p className="text-sm font-semibold text-on-surface">{p.name}</p>
              <p className="text-xs text-on-surface-variant">
                {p.phone || "No phone"} • {p.gender}
              </p>
            </button>
          ))}

        </div>
      )}

      {/* Full patient creation lives in the shared form — never a name-only
          shortcut, so records are always complete. */}
      {onNewPatient && (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onNewPatient();
          }}
          className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <UserPlus className="h-3.5 w-3.5" /> New Patient
        </button>
      )}
    </div>
  );
}
