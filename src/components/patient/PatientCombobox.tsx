"use client";

import React, { useRef, useState } from "react";
import { Search, Loader2, Check, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { toast } from "@/components/ui/use-toast";
import { Patient } from "@/types";

interface PatientComboboxProps {
  value: string;
  onChange: (id: string, name: string) => void;
  label?: string;
  placeholder?: string;
  /** Show the "Quick Add <name> as New Patient" action. */
  allowQuickAdd?: boolean;
}

/**
 * Searchable patient picker used by the appointment and prescription flows.
 * Search by name or phone, pick an existing patient, or Quick Add a brand new
 * one inline — so a first-time patient never blocks booking.
 */
export default function PatientCombobox({
  value,
  onChange,
  label = "Patient *",
  placeholder = "Search or type new patient name…",
  allowQuickAdd = true,
}: PatientComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const creatingRef = useRef(false);

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

  const handleQuickAdd = async () => {
    if (!query.trim()) return;
    // Guard against duplicate creation before the creating state re-renders.
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const res = await apiClient.post<any>(API_ROUTES.PATIENTS.CREATE, {
        name: query.trim(),
        age: 30,
        gender: "MALE",
      });
      const newPatient: Patient = res.data?.data || res.data;
      if (newPatient?.id) {
        handleSelect(newPatient);
        toast({
          title: "Patient added",
          description: `"${newPatient.name}" was created and selected.`,
          variant: "success",
        });
      }
    } catch (e: any) {
      toast({
        title: "Registration Error",
        description: e?.response?.data?.message || "Failed to create patient",
        variant: "destructive",
      });
    }
    creatingRef.current = false;
    setCreating(false);
  };

  return (
    <div className="relative">
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
          <Check className="h-3 w-3" /> Selected: {selectedName}
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

          {allowQuickAdd && query.trim() && (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={creating}
              className="flex w-full items-center gap-2 border-t border-outline-variant bg-primary/5 px-4 py-3 text-left text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>+ Quick Add &quot;{query.trim()}&quot; as New Patient</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
