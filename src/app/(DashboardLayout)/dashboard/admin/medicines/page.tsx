"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pill, Search, RefreshCw, Plus, X, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Inhaler", "Cream", "Ointment", "Gel", "Drops", "Suspension", "Powder", "Patch", "Suppository", "Lotion"];

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    brandName: "", generic: "", dosageForm: "Tablet",
    strength: "", manufacturer: "", type: "Tablet",
  });

  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "25", ...(search && { q: search }) });
      const res = await apiClient.get<any>(`/medicine/search?${params}`);
      const data = res.data?.data || res.data;
      setMedicines(Array.isArray(data) ? data : data?.items || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      setMedicines([]);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleCreate = async () => {
    if (!form.brandName.trim() || !form.generic.trim()) {
      toast({ title: "Required", description: "Brand name and generic are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const slug = `${slugify(form.brandName)}-${slugify(form.strength || form.generic)}`;
      await apiClient.post("/medicine", { ...form, slug });
      setShowNew(false);
      setForm({ brandName: "", generic: "", dosageForm: "Tablet", strength: "", manufacturer: "", type: "Tablet" });
      load();
      toast({ title: "Medicine Added", description: `${form.brandName} added to the database.`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to add medicine.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Medicine Database</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total > 0 ? `${total.toLocaleString()} medicines in database` : "Manage the medicine catalog"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="h-4 w-4 mr-1" /> Add Medicine
          </Button>
        </div>
      </div>

      {/* New Medicine Form */}
      {showNew && (
        <div className="rounded-2xl border border-primary/30 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add Medicine</h2>
            <button onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Brand Name *</label>
              <Input placeholder="e.g. Napa 500" value={form.brandName} onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Generic Name *</label>
              <Input placeholder="e.g. Paracetamol 500mg" value={form.generic} onChange={(e) => setForm((f) => ({ ...f, generic: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Strength</label>
              <Input placeholder="e.g. 500mg" value={form.strength} onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dosage Form</label>
              <select
                value={form.dosageForm}
                onChange={(e) => setForm((f) => ({ ...f, dosageForm: e.target.value, type: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DOSAGE_FORMS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Manufacturer</label>
              <Input placeholder="e.g. Beximco" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save Medicine
            </Button>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search by brand name or generic..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No medicines found{search ? ` for "${search}"` : ""}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {["Brand Name", "Generic", "Form", "Strength", "Manufacturer"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => (
                  <tr key={med.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{med.brandName}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{med.generic}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-medium">
                        {med.dosageForm || med.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{med.strength || "—"}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{med.manufacturer || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
