"use client";

import React, { useState, useEffect } from "react";
import {
  Hospital,
  PlusCircle,
  Calendar,
  Pencil,
  X,
  MapPin,
  Phone,
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Chamber } from "@/types";
import { useNotification } from "@/hooks/useNotification";
import { useConfirm } from "@/components/ui/confirm";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

const COLORS = [
  { iconBg: "bg-primary/10", iconColor: "text-primary", btnBg: "bg-primary text-on-primary" },
  { iconBg: "bg-teal-50", iconColor: "text-teal-600", btnBg: "bg-teal-600 text-white" },
  { iconBg: "bg-purple-50", iconColor: "text-purple-600", btnBg: "bg-purple-600 text-white" },
  { iconBg: "bg-amber-50", iconColor: "text-amber-600", btnBg: "bg-amber-500 text-white" },
];

function ChamberCard({
  chamber,
  colorIdx,
  onEdit,
  onDelete,
}: {
  chamber: any;
  colorIdx: number;
  onEdit: (c: Chamber) => void;
  onDelete: (id: string) => void;
}) {
  const col = COLORS[colorIdx % COLORS.length]!;
  const name = chamber.chamberName || chamber.name || "Chamber";
  const address = chamber.chamberAddress || chamber.address;
  const phone = chamber.phone || (chamber.phones && chamber.phones[0]);

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col group hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-5">
        <div className={`w-14 h-14 ${col.iconBg} ${col.iconColor} rounded-2xl flex items-center justify-center`}>
          <Hospital size={28} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${chamber.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {chamber.isActive !== false ? "Active" : "Inactive"}
          </span>
          <button
            onClick={() => onEdit(chamber)}
            className="h-8 w-8 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(chamber.id)}
            className="h-8 w-8 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <h3 className="text-base font-bold text-on-surface mb-1">{name}</h3>
      {address && (
        <div className="flex items-start gap-1.5 text-xs text-on-surface-variant mb-4">
          <MapPin size={12} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{address}</span>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {phone && (
          <div className="flex items-center justify-between p-2.5 bg-surface-container/50 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Phone size={14} className="text-primary" />
              <span className="font-medium">Phone</span>
            </div>
            <span className="font-semibold text-on-surface">{phone}</span>
          </div>
        )}
        {chamber.schedules && chamber.schedules.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-surface-container/50 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Calendar size={14} className="text-primary" />
              <span className="font-medium">Schedule</span>
            </div>
            <span className="font-semibold text-on-surface">
              {chamber.schedules.length} slot{chamber.schedules.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <button
          className={`w-full py-2.5 ${col.btnBg} rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity`}
          onClick={() => onEdit(chamber)}
        >
          Manage Chamber
        </button>
      </div>
    </div>
  );
}

function ChamberModal({
  chamber,
  onClose,
  onSaved,
}: {
  chamber: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { success, error: showError } = useNotification();
  const [form, setForm] = useState({
    name: chamber?.chamberName || chamber?.name || "",
    address: chamber?.chamberAddress || chamber?.address || "",
    phone: chamber?.phone || (chamber?.phones && chamber?.phones[0]) || "",
    email: chamber?.chamberEmail || chamber?.email || "",
    footerText: chamber?.footerText || "",
  });
  const [saving, setSaving] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) {
      errs.name = "Chamber name must be at least 3 characters long";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return showError("Please fix form errors shown below");
    }

    const addressText = form.address.trim().length >= 5 ? form.address.trim() : `${form.name.trim()} Address, Bangladesh`;

    setSaving(true);
    const payload = {
      chamberName: form.name.trim(),
      name: form.name.trim(),
      chamberAddress: addressText,
      address: addressText,
      chamberEmail: form.email.trim() || undefined,
      email: form.email.trim() || undefined,
      phones: form.phone.trim() ? [form.phone.trim()] : undefined,
      phone: form.phone.trim() || undefined,
      footerText: form.footerText.trim() || undefined,
    };

    try {
      if (chamber?.id) {
        await apiClient.patch(API_ROUTES.CHAMBERS.UPDATE(chamber.id), payload);
      } else {
        await apiClient.post(API_ROUTES.CHAMBERS.CREATE, payload);
      }
      success(`Chamber ${chamber ? "updated" : "created"} successfully`);
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save chamber";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-outline-variant max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface-container/50">
          <h2 className="text-lg font-bold text-on-surface">
            {chamber ? "Edit Chamber" : "Add New Chamber"}
          </h2>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {[
            { label: "Chamber Name * (min 3 chars)", key: "name", type: "text", placeholder: "e.g. Dhanmondi Medical Center" },
            { label: "Address (min 5 chars)", key: "address", type: "text", placeholder: "House #12, Road #5, Dhanmondi, Dhaka" },
            { label: "Phone", key: "phone", type: "tel", placeholder: "+880 1712-345678" },
            { label: "Email", key: "email", type: "email", placeholder: "chamber@example.com" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
              <Input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => update(key, e.target.value)}
                className={fieldErrors[key] ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {fieldErrors[key] && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-in fade-in duration-200">
                  ⚠️ {fieldErrors[key]}
                </p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Footer Text (for prescription)</label>
            <Textarea
              placeholder="Appears at the bottom of printed prescriptions..."
              rows={2}
              value={form.footerText}
              onChange={(e) => update("footerText", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-outline-variant">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {saving ? "Saving..." : chamber ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChambersPage() {
  const { success, error: showError } = useNotification();
  const confirm = useConfirm();
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChamber, setEditingChamber] = useState<Chamber | null>(null);

  const loadChambers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.CHAMBERS.LIST);
      setChambers(res.data?.data || res.data || []);
    } catch {
      setChambers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChambers();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this chamber?",
      description: "The chamber will be deactivated. Existing prescriptions and appointments are preserved.",
      confirmLabel: "Delete chamber",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiClient.delete(API_ROUTES.CHAMBERS.DELETE(id));
      success("Chamber deleted");
      setChambers((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to delete");
    }
  };

  const handleEdit = (c: Chamber) => {
    setEditingChamber(c);
    setModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Chambers</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure your clinical locations and patient scheduling workflows.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadChambers}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            onClick={() => { setEditingChamber(null); setModalOpen(true); }}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add New Chamber
          </Button>
        </div>
      </div>

      {/* Chamber Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {chambers.map((ch, idx) => (
            <ChamberCard
              key={ch.id}
              chamber={ch}
              colorIdx={idx}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Add card */}
          <button
            onClick={() => { setEditingChamber(null); setModalOpen(true); }}
            className="border-2 border-dashed border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center group hover:border-primary hover:bg-primary/5 transition-all duration-300 min-h-[280px] cursor-pointer bg-transparent"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
              <PlusCircle size={40} className="text-outline-variant group-hover:text-primary transition-colors" />
            </div>
            <span className="text-base font-bold text-on-surface-variant group-hover:text-primary">
              Add New Chamber
            </span>
            <p className="text-xs text-outline-variant mt-2 text-center max-w-[200px]">
              Expand your practice with a new clinical location
            </p>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ChamberModal
          chamber={editingChamber}
          onClose={() => setModalOpen(false)}
          onSaved={loadChambers}
        />
      )}
    </div>
  );
}
