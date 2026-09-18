"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Palette,
  Shield,
  Bell,
  Loader2,
  Save,
  Key,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useNotification } from "@/hooks/useNotification";

type TabId = "profile" | "branding" | "security";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
];

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    bmdcNumber: "",
    qualifications: "",
    specialization: "",
    bio: "",
    yearsOfExperience: "",
  });

  useEffect(() => {
    apiClient.get<any>(API_ROUTES.DOCTOR.PROFILE)
      .then((res) => {
        const d = res.data?.data || res.data;
        setProfile({
          name: d?.user?.name || "",
          bmdcNumber: d?.bmdcNumber || "",
          qualifications: d?.qualifications || "",
          specialization: d?.specialization || "",
          bio: d?.bio || "",
          yearsOfExperience: String(d?.yearsOfExperience || ""),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(API_ROUTES.DOCTOR.UPDATE_PROFILE, {
        bmdcNumber: profile.bmdcNumber,
        qualifications: profile.qualifications,
        specialization: profile.specialization,
        bio: profile.bio,
        yearsOfExperience: Number(profile.yearsOfExperience) || undefined,
      });
      success("Profile updated successfully");
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to update profile");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <h3 className="text-base font-bold text-on-surface mb-5">Professional Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full Name</label>
            <Input value={profile.name} disabled className="bg-surface-container/50" />
            <p className="text-[10px] text-on-surface-variant mt-1">Name is managed via Auth settings.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">BMDC Number</label>
            <Input
              value={profile.bmdcNumber}
              onChange={(e) => setProfile({ ...profile, bmdcNumber: e.target.value })}
              placeholder="e.g. A-12345"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Specialization</label>
            <Input
              value={profile.specialization}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              placeholder="e.g. Cardiology"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Years of Experience</label>
            <Input
              type="number"
              min={0}
              value={profile.yearsOfExperience}
              onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
              placeholder="e.g. 10"
            />
          </div>
          <div className="col-span-full">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Qualifications / Degrees</label>
            <Textarea
              rows={2}
              value={profile.qualifications}
              onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })}
              placeholder="MBBS, MD, FCPS…"
            />
          </div>
          <div className="col-span-full">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Bio</label>
            <Textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Brief professional summary…"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────

function BrandingTab() {
  const { success, error: showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    legalName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    primaryColor: "#1a73e8",
    secondaryColor: "#00897b",
  });

  useEffect(() => {
    apiClient.get<any>(API_ROUTES.INSTITUTION.PROFILE)
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d) {
          setForm({
            legalName: d.legalName || "",
            address: d.address || "",
            phone: d.phone || "",
            email: d.email || "",
            website: d.website || "",
            primaryColor: d.primaryColor || "#1a73e8",
            secondaryColor: d.secondaryColor || "#00897b",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(API_ROUTES.INSTITUTION.UPDATE_BRANDING, form);
      success("Branding settings saved");
    } catch (e: any) {
      showError(e?.response?.data?.message || "Failed to save branding");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-2xl border border-outline-variant p-6">
        <h3 className="text-base font-bold text-on-surface mb-5">Prescription Letterhead</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Institution / Clinic Name", key: "legalName", type: "text", placeholder: "e.g. Dhaka Heart Institute" },
            { label: "Phone", key: "phone", type: "tel", placeholder: "+880 1XXX-XXXXXX" },
            { label: "Email", key: "email", type: "email", placeholder: "clinic@example.com" },
            { label: "Website", key: "website", type: "url", placeholder: "https://yoursite.com" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
              <Input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="col-span-full">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Address</label>
            <Textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full postal address…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-9 w-16 cursor-pointer rounded border border-input" />
              <Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="flex-1 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="h-9 w-16 cursor-pointer rounded border border-input" />
              <Input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="flex-1 font-mono" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? "Saving…" : "Save Branding"}
          </Button>
        </div>
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState<TabId>("profile");

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
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "branding" && <BrandingTab />}
        {activeTab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}
