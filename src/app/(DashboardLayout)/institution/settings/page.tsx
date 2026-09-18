"use client";

import React, { useState, useEffect } from "react";
import { Settings2, Save, Loader2, Building, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { InstitutionProfile } from "@/types";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function InstitutionSettingsPage() {
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    legalName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    registrationNumber: "",
  });
  const [branding, setBranding] = useState({
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(API_ROUTES.INSTITUTION.PROFILE);
        const p = res.data?.data || res.data;
        setProfile(p);
        if (p) {
          setForm({
            legalName: p.legalName || "",
            address: p.address || "",
            phone: p.phone || "",
            email: p.email || "",
            website: p.website || "",
            registrationNumber: p.registrationNumber || "",
          });
          setBranding({
            primaryColor: p.primaryColor || "#3b82f6",
            secondaryColor: p.secondaryColor || "#10b981",
          });
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiClient.patch<any>(API_ROUTES.INSTITUTION.UPDATE_PROFILE, form);
      setProfile(res.data?.data || res.data);
      toast({
        title: "Settings Saved",
        description: "Institution profile updated successfully.",
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "Save Error",
        description: e?.response?.data?.message || "Failed to save profile.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      await apiClient.patch(API_ROUTES.INSTITUTION.UPDATE_BRANDING, branding);
      toast({
        title: "Branding Saved",
        description: "Institution branding updated successfully.",
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "Branding Error",
        description: e?.response?.data?.message || "Failed to save branding.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const updateForm = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Institution Settings</h1>
        <p className="text-sm text-on-surface-variant">Manage your institution profile and branding</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant bg-surface-container/50">
          <Building className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-on-surface">Profile Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Legal Name", key: "legalName", placeholder: "Institution legal name" },
              { label: "Registration Number", key: "registrationNumber", placeholder: "Trade license / registration" },
              { label: "Address", key: "address", placeholder: "Full address" },
              { label: "Phone", key: "phone", placeholder: "+880..." },
              { label: "Email", key: "email", placeholder: "info@institution.com" },
              { label: "Website", key: "website", placeholder: "https://..." },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-on-surface-variant mb-1.5 font-medium">{f.label}</label>
                <Input
                  value={(form as any)[f.key]}
                  onChange={(e) => updateForm(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant bg-surface-container/50">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-on-surface">Branding</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5 font-medium">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={branding.primaryColor} onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))} className="h-10 w-10 rounded border cursor-pointer" />
                <Input value={branding.primaryColor} onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))} className="text-sm flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5 font-medium">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={branding.secondaryColor} onChange={(e) => setBranding((b) => ({ ...b, secondaryColor: e.target.value }))} className="h-10 w-10 rounded border cursor-pointer" />
                <Input value={branding.secondaryColor} onChange={(e) => setBranding((b) => ({ ...b, secondaryColor: e.target.value }))} className="text-sm flex-1" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={saveBranding} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save Branding
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
