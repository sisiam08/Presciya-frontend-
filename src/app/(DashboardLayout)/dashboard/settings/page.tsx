"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Palette,
  Shield,
  Loader2,
  Save,
  Key,
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  Check,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import {
  API_ROUTES,
  PRESCRIPTION_LANGUAGES,
  PRESCRIPTION_DESIGN_TEMPLATES,
} from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";
import A4PreviewFrame from "@/components/prescription/A4PreviewFrame";
import FeatureGate from "@/components/ui/FeatureGate";
import {
  PrescriptionLanguage,
  PrescriptionDesignTemplate,
} from "@/types";

type TabId = "prescription" | "fees" | "branding" | "security";

// NOTE: no "Profile" tab here — the dedicated /dashboard/profile section in the
// sidebar owns profile editing.
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "prescription", label: "Prescription", icon: FileText },
  { id: "fees", label: "Visiting Fee", icon: Wallet },
  // Personal prescription settings only — chamber branding lives in
  // Chambers → Manage Chamber.
  { id: "branding", label: "Personal Prescription", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
];

// ─── Prescription Tab ─────────────────────────────────────────────────────────

function PrescriptionTab() {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<PrescriptionLanguage>(
    PrescriptionLanguage.ENGLISH,
  );
  const [template, setTemplate] = useState<PrescriptionDesignTemplate>(
    PrescriptionDesignTemplate.DEFAULT,
  );
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<any>(API_ROUTES.DOCTOR.PROFILE)
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d?.prescriptionLanguage) setLanguage(d.prescriptionLanguage);
        if (d?.prescriptionTemplate) setTemplate(d.prescriptionTemplate);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Preview uses the SAME backend renderer as the real prescription/PDF.
  useEffect(() => {
    let active = true;
    setPreviewLoading(true);
    apiClient
      .get<string>(
        API_ROUTES.PRESCRIPTIONS.TEMPLATE_PREVIEW(template, language),
        { responseType: "text" },
      )
      .then((res) => {
        if (active) setPreviewHtml(res.data);
      })
      .catch(() => {
        if (active) setPreviewHtml(null);
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [template, language]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(API_ROUTES.DOCTOR.UPDATE_PROFILE, {
        prescriptionLanguage: language,
        prescriptionTemplate: template,
      });
      success("Prescription settings saved");
    } catch (e: any) {
      showError(
        e?.response?.data?.message || "Failed to save prescription settings",
      );
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Language */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <h3 className="text-base font-bold text-on-surface mb-1">
          Prescription Language
        </h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Only the doctor&apos;s instructions, advice, next-visit label and
          medicine taking time change language. Everything else stays as
          entered. New prescriptions use this; finalized ones keep their own
          language.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESCRIPTION_LANGUAGES.map((lang) => {
            const selected = language === lang.value;
            return (
              <button
                key={lang.value}
                type="button"
                onClick={() => setLanguage(lang.value as PrescriptionLanguage)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant hover:border-primary/40"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {lang.label}
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    e.g. {lang.sample}
                  </p>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    selected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant"
                  }`}
                >
                  {selected && <Check size={12} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <h3 className="text-base font-bold text-on-surface mb-1">
          Prescription Template
        </h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Choose the design used for new prescriptions. Finalized prescriptions
          keep the template they were issued with.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESCRIPTION_DESIGN_TEMPLATES.map((tpl) => {
            const selected = template === tpl.value;
            return (
              <button
                key={tpl.value}
                type="button"
                onClick={() =>
                  setTemplate(tpl.value as PrescriptionDesignTemplate)
                }
                className={`rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-outline-variant hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-on-surface">{tpl.name}</p>
                  {selected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                  {tpl.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saving ? "Saving…" : "Save Prescription Settings"}
          </Button>
        </div>
      </div>

      {/* Live preview (same renderer as PDF/print) */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-on-surface">Live Preview</h3>
            <p className="text-xs text-on-surface-variant">
              Exactly what the printed prescription will look like.
            </p>
          </div>
          {previewLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
        <div className="max-h-[80vh] overflow-auto rounded-xl border border-outline-variant bg-slate-100 p-4 dark:bg-slate-900">
          <A4PreviewFrame html={previewHtml} title="Template preview" />
        </div>
      </div>
    </div>
  );
}

// ─── Visiting Fee Tab ─────────────────────────────────────────────────────────

function FeesTab() {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [fee, setFee] = useState({ visitingFee: "", followUpFee: "" });

  useEffect(() => {
    apiClient
      .get<any>(API_ROUTES.WORKSPACES.LIST)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const wsId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeWorkspaceId")
            : null;
        const active = list.find((w: any) => w.id === wsId) || list[0];
        setWorkspaceName(active?.name || "");
      })
      .catch(() => {});

    apiClient
      .get<any>(API_ROUTES.VISITING_FEE.MY)
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setFee({
          visitingFee: d?.visitingFee != null ? String(d.visitingFee) : "",
          followUpFee: d?.followUpFee != null ? String(d.followUpFee) : "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!fee.visitingFee || Number(fee.visitingFee) < 0) {
      return showError("Enter a valid visiting fee");
    }
    setSaving(true);
    try {
      await apiClient.put(API_ROUTES.VISITING_FEE.MY, {
        visitingFee: fee.visitingFee,
        followUpFee: fee.followUpFee.trim() === "" ? null : fee.followUpFee,
      });
      success("Visiting fee saved");
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to save visiting fee");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-outline-variant bg-surface p-6">
        <h3 className="mb-1 text-base font-bold text-on-surface">
          Consultation Fee
        </h3>
        <p className="mb-5 text-xs text-on-surface-variant">
          Your fee for{" "}
          <span className="font-semibold text-on-surface">
            {workspaceName || "this workspace"}
          </span>
          . Only you can change this — hospitals and clinics cannot.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Normal Visiting Fee (৳) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fee.visitingFee}
              onChange={(e) => setFee({ ...fee, visitingFee: e.target.value })}
              placeholder="e.g. 1000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Follow-up Fee (৳)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fee.followUpFee}
              onChange={(e) => setFee({ ...fee, followUpFee: e.target.value })}
              placeholder="Defaults to the normal fee"
            />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-on-surface-variant">
          Leave the follow-up fee empty to charge the normal visiting fee for
          follow-ups.
        </p>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save Fee"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────

/**
 * Prescription branding is WORKSPACE-AWARE:
 *  - PERSONAL    → a personal prescription is issued in the doctor's own name, so
 *                  it uses the Doctor Profile identity. No clinic/chamber fields.
 *  - CHAMBER     → doctor identity (automatic) + chamber-specific branding.
 *  - INSTITUTION → not part of the current public release.
 *
 * Prescription colours are deliberately NOT configurable — each template owns
 * its own design (the old Primary/Secondary colour pickers are gone).
 */
/**
 * Personal Prescription settings — ONLY for prescriptions created in the
 * PERSONAL workspace.
 *
 * Doctor identity is resolved automatically from the Doctor Profile and is
 * never re-entered here. The footer + watermark are the doctor's PERSONAL
 * prescription customization and are subscription-controlled through the
 * existing `custom_branding` entitlement — the existing FeatureGate renders the
 * locked state, so no new restriction UI is introduced.
 *
 * Chamber prescription branding lives in Chambers → Manage Chamber.
 */
function BrandingTab() {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [doctor, setDoctor] = useState({
    name: "",
    qualification: "",
    specialization: "",
    registrationNo: "",
    phone: "",
    email: "",
  });
  const [footerText, setFooterText] = useState("");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkUrl, setWatermarkUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      const wsId =
        typeof window !== "undefined"
          ? localStorage.getItem("activeWorkspaceId")
          : null;
      try {
        const [wsRes, docRes] = await Promise.all([
          apiClient.get<any>(API_ROUTES.WORKSPACES.LIST).catch(() => ({ data: [] })),
          apiClient.get<any>(API_ROUTES.DOCTOR.PROFILE).catch(() => ({ data: null })),
        ]);

        const list = wsRes.data?.data || wsRes.data || [];
        const active = list.find((w: any) => w.id === wsId) || list[0];
        setWorkspaceId(active?.id || "");

        const cfg = (active?.templateConfig || {}) as any;
        setFooterText(cfg.footerText || "");
        setWatermarkEnabled(Boolean(cfg.watermarkEnabled));
        setWatermarkText(cfg.watermarkText || "");
        setWatermarkUrl(cfg.watermarkUrl || "");

        const d = docRes.data?.data || docRes.data;
        setDoctor({
          name: d?.user?.name || d?.name || "",
          qualification: d?.qualifications || d?.qualification || "",
          specialization: d?.specialization || "",
          registrationNo: d?.bmdcNumber || d?.registrationNo || "",
          phone: d?.user?.phone || d?.phone || "",
          email: d?.user?.email || d?.email || "",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      await apiClient.patch(API_ROUTES.WORKSPACES.UPDATE(workspaceId), {
        templateConfig: {
          footerText: footerText.trim() || "",
          watermarkEnabled,
          watermarkText: watermarkText.trim() || "",
          watermarkUrl: watermarkUrl.trim() || "",
        },
      });
      success("Personal prescription settings saved");
    } catch (e: any) {
      showError(
        e?.response?.data?.message ||
          "Failed to save personal prescription settings",
      );
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // The WHOLE tab is the premium "Personal prescription" surface, so the gate
  // wraps everything — the doctor identity block included.
  return (
    <FeatureGate feature="custom_branding" label="Personal prescription">
    <div className="space-y-5">
      {/* Doctor identity — automatic, resolved from the profile. */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-on-surface">Doctor Identity</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              A personal prescription is issued in your own name — these come from
              your Profile and are never re-entered here.
            </p>
          </div>
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Doctor Name", value: doctor.name },
            { label: "Qualifications", value: doctor.qualification },
            { label: "Specialty", value: doctor.specialization },
            { label: "BMDC / Registration No.", value: doctor.registrationNo },
            { label: "Phone", value: doctor.phone },
            { label: "Email", value: doctor.email },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                {label}
              </label>
              <Input value={value || "—"} disabled className="bg-surface-container/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Personal prescription customization — part of the gated tab above. */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
          <h3 className="text-base font-bold text-on-surface mb-1">
            Personal Prescription
          </h3>
          <p className="text-xs text-on-surface-variant mb-5">
            Extra information printed on prescriptions you issue from your Personal
            workspace.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Custom Footer
              </label>
              <Textarea
                rows={2}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. For appointments: 01XXXXXXXXX"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Printed exactly as entered (never translated).
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
                Watermark
              </label>
              {watermarkEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Watermark Text
                    </label>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Watermark Image URL
                    </label>
                    <Input
                      value={watermarkUrl}
                      onChange={(e) => setWatermarkUrl(e.target.value)}
                      placeholder="https://…/watermark.png"
                    />
                  </div>
                  <p className="col-span-full text-[10px] text-on-surface-variant">
                    The image is used when provided, otherwise the text. Drawn subtly
                    behind the content — it never covers medicines or the signature.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="min-w-[180px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {saving ? "Saving…" : "Save Personal Prescription"}
            </Button>
          </div>
        </div>
    </div>
    </FeatureGate>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const { success, error: showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, val: string) => {
    setForm({ ...form, [key]: val });
    setErrors({ ...errors, [key]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = "Current password is required";
    if (form.newPassword.length < 8) errs.newPassword = "New password must be at least 8 characters";
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to change password");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <div className="flex items-center gap-3 mb-5">
          <Key className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-on-surface">Change Password</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {[
            { label: "Current Password", key: "currentPassword" },
            { label: "New Password", key: "newPassword" },
            { label: "Confirm New Password", key: "confirmPassword" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={(form as any)[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="••••••••"
                  className={errors[key] ? "border-red-400 focus-visible:ring-red-200" : ""}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
            </div>
          ))}

          <div className="pt-2">
            <Button type="submit" disabled={saving} className="min-w-[160px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* Session info (read-only) */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <h3 className="text-base font-bold text-on-surface mb-4">Session Security</h3>
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Secure session active</p>
            <p className="text-xs text-emerald-700 mt-0.5">Cookie-based JWT authentication is in use. Tokens expire automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("prescription");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage your profile, branding, and account security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "prescription" && (
          <FeatureGate
            feature="prescription_language"
            label="Prescription language & templates"
          >
            <PrescriptionTab />
          </FeatureGate>
        )}
        {activeTab === "fees" && (
          <FeatureGate feature="visiting_fees" label="Visiting fees">
            <FeesTab />
          </FeatureGate>
        )}
        {activeTab === "branding" && <BrandingTab />}
        {activeTab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}
