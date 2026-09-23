"use client";

import Link from "next/link";
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
  Lock,
} from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { Chamber } from "@/types";
import { useNotification } from "@/hooks/useNotification";
import { useConfirm } from "@/components/ui/confirm";
import VerificationNotice from "@/components/verification/VerificationNotice";
import FeatureGate from "@/components/ui/FeatureGate";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { useMe } from "@/hooks/useMe";
import {
  BD_PHONE_MESSAGE,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
} from "@/lib/utils";

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
  // Prescription branding is plan-controlled. The UI must not offer controls
  // the active plan does not include — otherwise the user only discovers the
  // restriction after submitting. `FeatureGate` below renders the existing
  // restricted-feature view when a key is missing.
  const { isAllowed } = useEntitlements();
  const canBranding = isAllowed("custom_branding");
  const canWatermark = isAllowed("watermark");
  // Existing templateConfig (theme keys etc.) is preserved on save so the
  // watermark fields never wipe unrelated chamber branding settings.
  const baseTemplateConfig: Record<string, unknown> =
    chamber?.templateConfig || {};
  const [form, setForm] = useState({
    name: chamber?.chamberName || chamber?.name || "",
    address: chamber?.chamberAddress || chamber?.address || "",
    phone: chamber?.phone || (chamber?.phones && chamber?.phones[0]) || "",
    email: chamber?.chamberEmail || chamber?.email || "",
    footerText: chamber?.footerText || "",
    // Chamber-specific prescription branding.
    logo: chamber?.logo || "",
    watermarkEnabled: Boolean((chamber as any)?.templateConfig?.watermarkEnabled),
    watermarkText: (chamber as any)?.templateConfig?.watermarkText || "",
    watermarkUrl: (chamber as any)?.templateConfig?.watermarkUrl || "",
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
    // Optional — but a provided value must be a Bangladesh mobile.
    if (form.phone.trim() && !isValidBangladeshPhone(form.phone)) {
      errs.phone = BD_PHONE_MESSAGE;
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
      // Canonical domestic form (+8801712345678 -> 01712345678).
      phones: form.phone.trim()
        ? [normalizeBangladeshPhone(form.phone)]
        : undefined,
      phone: form.phone.trim()
        ? normalizeBangladeshPhone(form.phone)
        : undefined,
      // Branding fields are only sent when the plan actually includes the
      // entitlement (the backend enforces the same thing, but sending values
      // the plan excludes would produce a late, confusing error).
      chamberSlogan: canBranding ? form.footerText.trim() || undefined : undefined,
      footerText: canBranding ? form.footerText.trim() || undefined : undefined,
      logo: canBranding ? form.logo.trim() || undefined : undefined,
      // Watermark lives on the chamber's templateConfig. It is omitted entirely
      // when the plan has no watermark entitlement so chamber creation keeps its
      // default template settings.
      templateConfig: canWatermark
        ? {
            ...baseTemplateConfig,
            watermarkEnabled: form.watermarkEnabled,
            watermarkText: form.watermarkText.trim() || "",
            watermarkUrl: form.watermarkUrl.trim() || "",
          }
        : undefined,
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
            { label: "Phone", key: "phone", type: "tel", placeholder: "01XXXXXXXXX" },
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
          {/* Prescription Settings — what this chamber prints on its
              prescriptions. Doctor identity is automatic (from the profile).
              Footer/logo require `custom_branding`; the watermark additionally
              requires `watermark`. Both reuse the shared FeatureGate so the
              restricted-feature view is identical to the rest of the app. */}
          {/* Section-level gate: only this block is restricted — the chamber's
              name/address/phone/email fields above stay fully usable. */}
          <FeatureGate feature="custom_branding" label="Prescription branding" variant="inline">
          <div className="rounded-xl border border-outline-variant p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Prescription Settings</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Printed on prescriptions issued in this chamber, alongside your doctor
                identity. Each chamber keeps its own configuration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                label="Chamber Logo"
                value={form.logo}
                onChange={(url) => update("logo", url)}
                hint="JPEG, PNG or WebP up to 5 MB."
              />
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Footer Text (for prescription)</label>
                <Input
                  placeholder="e.g. Appointments: 01XXXXXXXXX"
                  value={form.footerText}
                  onChange={(e) => update("footerText", e.target.value)}
                />
              </div>
            </div>

            {/* Only rendered when the branding entitlement is present, so the
                outer gate never stacks a second lock card on top of this one. */}
            {canBranding && (
            <FeatureGate feature="watermark" label="Prescription watermark" variant="inline">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={form.watermarkEnabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, watermarkEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
                Watermark
              </label>
              {form.watermarkEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Watermark Text</label>
                    <Input
                      placeholder="e.g. ABC Chamber"
                      value={form.watermarkText}
                      onChange={(e) => update("watermarkText", e.target.value)}
                    />
                  </div>
                  <ImageUploadField
                    label="Watermark Image"
                    value={form.watermarkUrl}
                    onChange={(url) => update("watermarkUrl", url)}
                    hint="Optional — used instead of the text when provided."
                  />
                </div>
              )}
            </div>
            </FeatureGate>
            )}
          </div>
          </FeatureGate>

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
  const { entitlements } = useEntitlements();
  // Admin-configurable chamber limit for the current plan; null = unlimited.
  const chamberLimit = entitlements?.features?.max_chambers?.limit ?? null;
  const limitReached = chamberLimit !== null && chambers.length >= chamberLimit;
  // Writes are rejected server-side until the doctor/institution profile is
  // APPROVED (see checkUserVerification), so mirror that here instead of
  // letting the user submit a form the API will refuse. Unknown status is not
  // treated as blocked — only a known non-APPROVED status is.
  // Shared single-flight `/auth/me` (also used by VerificationNotice, so the two
  // no longer issue separate identical requests).
  const { profile } = useMe();
  const verificationStatus =
    (profile?.verificationStatus as string | undefined) ?? null;
  const verificationBlocked =
    verificationStatus !== null && verificationStatus !== "APPROVED";
  const addBlocked = limitReached || verificationBlocked;

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
            disabled={addBlocked}
            title={
              verificationBlocked
                ? "Complete professional verification to add chambers"
                : limitReached
                  ? `Your plan allows ${chamberLimit} chamber(s)`
                  : undefined
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add New Chamber
          </Button>
        </div>
      </div>

      {/* Explains why chamber writes are unavailable (renders nothing once
          the profile is APPROVED). */}
      <VerificationNotice />

      {/* Chamber limit notice */}
      {chamberLimit !== null && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            limitReached
              ? "border-amber-300 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
              : "border-outline-variant bg-surface"
          }`}
        >
          <Lock className={`h-4 w-4 shrink-0 ${limitReached ? "text-amber-600" : "text-on-surface-variant"}`} />
          <div className="flex-1">
            <p className="font-semibold text-on-surface">
              Chamber limit: {chambers.length} / {chamberLimit}
            </p>
            {limitReached && (
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Your current plan allows {chamberLimit} chamber
                {chamberLimit === 1 ? "" : "s"}. Upgrade your plan to add more.
              </p>
            )}
          </div>
          {limitReached && (
                      <Link href="/dashboard/subscription">
                        <Button size="sm">View Plans</Button>
                      </Link>
          )}
        </div>
      )}

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
            onClick={() => {
              if (addBlocked) return;
              setEditingChamber(null);
              setModalOpen(true);
            }}
            disabled={addBlocked}
            title={
              verificationBlocked
                ? "Complete professional verification to add chambers"
                : undefined
            }
            className={`border-2 border-dashed border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center group transition-all duration-300 min-h-[280px] bg-transparent ${
              addBlocked
                ? "cursor-not-allowed opacity-60"
                : "hover:border-primary hover:bg-primary/5 cursor-pointer"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
              {addBlocked ? (
                <Lock size={36} className="text-amber-500" />
              ) : (
                <PlusCircle size={40} className="text-outline-variant group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="text-base font-bold text-on-surface-variant group-hover:text-primary">
              {verificationBlocked
                ? "Verification required"
                : limitReached
                  ? "Chamber limit reached"
                  : "Add New Chamber"}
            </span>
            <p className="text-xs text-outline-variant mt-2 text-center max-w-[200px]">
              {verificationBlocked
                ? "Complete your professional verification to add chambers."
                : limitReached
                  ? `Your plan allows ${chamberLimit} chamber(s). Upgrade to add more.`
                  : "Expand your practice with a new clinical location"}
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
