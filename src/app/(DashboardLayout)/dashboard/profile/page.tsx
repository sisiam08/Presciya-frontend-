"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  BadgeCheck,
  Clock,
  AlertTriangle,
  Upload,
  Save,
  Stethoscope,
  GraduationCap,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES, VERIFICATION_STATUS_CONFIG } from "@/lib/constants";
import { DoctorProfile, VerificationStatus, User as UserType } from "@/types";
import {
  BD_PHONE_MESSAGE,
  formatDate,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
} from "@/lib/utils";

// ─── Verification banner ──────────────────────────────────────────────────────
function VerificationBanner({ status }: { status: VerificationStatus }) {
  const cfg = VERIFICATION_STATUS_CONFIG[status];
  const iconMap: Record<VerificationStatus, React.ElementType> = {
    PENDING: Clock,
    UNDER_REVIEW: Shield,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
  };
  const Icon = iconMap[status] || Clock;
  const messages: Record<VerificationStatus, string> = {
    PENDING: "Your professional verification is pending. Submit your documents to get verified.",
    UNDER_REVIEW: "Your verification is currently under review by Presciya admin.",
    APPROVED: "Your professional profile has been verified. You have full access.",
    REJECTED: "Your verification was rejected. Please update your information and resubmit.",
  };

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.color}`}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">{cfg.label}</p>
        <p className="text-xs mt-0.5 opacity-80">{messages[status]}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant bg-surface-container/50">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label,
  value,
  name,
  editing,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  name: string;
  editing: boolean;
  onChange: (name: string, val: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-on-surface-variant mb-1.5 font-medium">{label}</label>
      {editing ? (
        <>
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder || label}
            className={error ? "text-sm border-red-500" : "text-sm"}
          />
          {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
        </>
      ) : (
        <p className="text-sm text-on-surface py-2 px-3 rounded-lg bg-surface-container min-h-[38px]">
          {value || <span className="text-on-surface-variant italic">Not set</span>}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ phone?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Editable fields
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [doctorForm, setDoctorForm] = useState({
    bmdcNumber: "",
    qualifications: "",
    specialization: "",
    yearsOfExperience: "",
    bio: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [userRes, doctorRes] = await Promise.all([
          apiClient.get<any>(API_ROUTES.AUTH.ME),
          apiClient.get<any>(API_ROUTES.DOCTOR.PROFILE).catch(() => ({ data: null })),
        ]);

        // /auth/me returns { user, profile, workspaces }; unwrap the user.
        const payload = userRes.data?.data || userRes.data;
        const u = payload?.user ?? payload;
        setUser(u);
        setProfileForm({
          name: u?.name || "",
          email: u?.email || "",
          phone: u?.phone || "",
        });

        const d = doctorRes.data?.data || doctorRes.data;
        if (d) {
          setDoctor(d);
          setDoctorForm({
            bmdcNumber: d.bmdcNumber || "",
            qualifications: d.qualifications || "",
            specialization: d.specialization || "",
            yearsOfExperience: d.yearsOfExperience?.toString() || "",
            bio: d.bio || "",
          });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateProfile = (name: string, val: string) => {
    setProfileForm((p) => ({ ...p, [name]: val }));
    if (name === "phone") setProfileErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const saveProfile = async () => {
    // Optional — but a provided value must be a Bangladesh mobile.
    if (profileForm.phone.trim() && !isValidBangladeshPhone(profileForm.phone)) {
      setProfileErrors({ phone: BD_PHONE_MESSAGE });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiClient.patch<any>(API_ROUTES.AUTH.UPDATE_ME, {
        name: profileForm.name.trim(),
        // Canonical domestic form (+8801712345678 -> 01712345678).
        phone: profileForm.phone.trim()
          ? normalizeBangladeshPhone(profileForm.phone)
          : "",
      });
      const updated = res.data?.data || res.data;
      setUser(updated?.user || updated);
      setProfileForm({
        name: updated?.user?.name || updated?.name || "",
        email: updated?.user?.email || updated?.email || "",
        phone: updated?.user?.phone || updated?.phone || "",
      });
      setEditingProfile(false);
      setProfileErrors({});
      toast({
        title: "Account Updated",
        description: "Your account information has been saved.",
      });
    } catch (e: any) {
      toast({
        title: "Profile Error",
        description:
          e?.response?.data?.message || "Failed to save account information.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };
  const updateDoctor = (name: string, val: string) =>
    setDoctorForm((p) => ({ ...p, [name]: val }));

  const saveDoctor = async () => {
    setSaving(true);
    try {
      // Map the form fields to the API contract (bmdcNumber -> registrationNo,
      // qualifications -> qualification). Unsupported extras are omitted.
      const payload: Record<string, any> = {};
      if (doctorForm.bmdcNumber?.trim())
        payload.registrationNo = doctorForm.bmdcNumber.trim();
      if (doctorForm.qualifications?.trim())
        payload.qualification = doctorForm.qualifications.trim();
      if (doctorForm.specialization?.trim())
        payload.specialization = doctorForm.specialization.trim();
      const res = await apiClient.patch<any>(API_ROUTES.DOCTOR.UPDATE_PROFILE, payload);
      setDoctor(res.data?.data || res.data);
      setEditingDoctor(false);
    } catch (e: any) {
      toast({
        title: "Profile Error",
        description: e?.response?.data?.message || "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitVerification = async () => {
    setSubmittingVerification(true);
    try {
      const workspaceId =
        typeof window !== "undefined"
          ? localStorage.getItem("activeWorkspaceId")
          : null;

      await apiClient.post(API_ROUTES.VERIFICATION.SUBMIT, {
        // Backend expects PERSONAL / INSTITUTION.
        type: "PERSONAL",
        ...(workspaceId ? { workspaceId } : {}),
        submittedData: {
          name: (doctorForm as any).name || (doctor as any)?.name || undefined,
          bmdcNumber: doctorForm.bmdcNumber || undefined,
          qualifications: doctorForm.qualifications || undefined,
          specialization: doctorForm.specialization || undefined,
          designation: (doctorForm as any).designation || undefined,
          yearsOfExperience: doctorForm.yearsOfExperience
            ? Number(doctorForm.yearsOfExperience)
            : undefined,
          bio: doctorForm.bio || undefined,
        },
      });
      // Refresh doctor profile to get updated status
      const res = await apiClient.get<any>(API_ROUTES.DOCTOR.PROFILE);
      setDoctor(res.data?.data || res.data);
      toast({
        title: "Verification Submitted",
        description: "Your doctor verification request has been submitted for admin review.",
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "Verification Error",
        description: e?.response?.data?.message || "Failed to submit verification.",
        variant: "destructive",
      });
    } finally {
      setSubmittingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Profile</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Manage your account and professional information
        </p>
      </div>

      {/* Verification banner */}
      {doctor && (
        <VerificationBanner status={doctor.verificationStatus} />
      )}

      {/* Account Info */}
      <SectionCard title="Account Information" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Full Name"
            value={profileForm.name}
            name="name"
            editing={editingProfile}
            onChange={updateProfile}
          />
          <Field
            label="Email"
            value={profileForm.email}
            name="email"
            editing={false}
            onChange={() => {}}
          />
          <Field
            label="Phone"
            value={profileForm.phone}
            name="phone"
            editing={editingProfile}
            onChange={updateProfile}
            placeholder="+880 1XXXXXXXXX"
            error={profileErrors.phone}
          />
          <div>
            <label className="block text-xs text-on-surface-variant mb-1.5 font-medium">
              Account Status
            </label>
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-surface-container min-h-[38px]">
              {user?.isVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600">Email Verified</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600">Email Not Verified</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {editingProfile ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditingProfile(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveProfile} disabled={savingProfile}>
                <Save className="h-4 w-4 mr-1" />
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
              Edit Account
            </Button>
          )}
        </div>
      </SectionCard>

      {/* Doctor Profile */}
      <SectionCard title="Professional Information" icon={Stethoscope}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="BMDC Registration Number"
            value={doctorForm.bmdcNumber}
            name="bmdcNumber"
            editing={editingDoctor}
            onChange={updateDoctor}
            placeholder="e.g. A-12345"
          />
          <Field
            label="Years of Experience"
            value={doctorForm.yearsOfExperience}
            name="yearsOfExperience"
            editing={editingDoctor}
            onChange={updateDoctor}
            type="number"
          />
          <Field
            label="Qualifications"
            value={doctorForm.qualifications}
            name="qualifications"
            editing={editingDoctor}
            onChange={updateDoctor}
            placeholder="e.g. MBBS, FCPS (Medicine)"
          />
          <Field
            label="Specialization"
            value={doctorForm.specialization}
            name="specialization"
            editing={editingDoctor}
            onChange={updateDoctor}
            placeholder="e.g. Internal Medicine"
          />
          <div className="md:col-span-2">
            <Field
              label="Bio"
              value={doctorForm.bio}
              name="bio"
              editing={editingDoctor}
              onChange={updateDoctor}
              placeholder="Brief professional bio..."
            />
          </div>
        </div>

        {/* Signature */}
        <div className="mt-4">
          <label className="block text-xs text-on-surface-variant mb-1.5 font-medium">
            Digital Signature
          </label>
          <div className="flex items-center gap-4">
            {doctor?.signatureUrl ? (
              <div className="h-20 w-48 rounded-xl border border-outline-variant bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={doctor.signatureUrl}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-20 w-48 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 bg-surface-container">
                <Upload className="h-5 w-5 text-on-surface-variant/50" />
                <p className="text-[10px] text-on-surface-variant">No signature uploaded</p>
              </div>
            )}
            {editingDoctor && (
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Upload Signature
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-outline-variant">
          <div>
            {doctor?.verificationStatus === VerificationStatus.PENDING && (
              <Button
                size="sm"
                onClick={submitVerification}
                disabled={submittingVerification}
              >
                {submittingVerification ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4 mr-1" />
                )}
                Submit for Verification
              </Button>
            )}
            {doctor?.verificationStatus === VerificationStatus.REJECTED && (
              <Button size="sm" onClick={submitVerification} disabled={submittingVerification}>
                <BadgeCheck className="h-4 w-4 mr-1" />
                Resubmit Verification
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {editingDoctor ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditingDoctor(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveDoctor} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditingDoctor(true)}>
                Edit Professional Info
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Membership info */}
      {user && (
        <SectionCard title="System Information" icon={Shield}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-on-surface-variant">System Role</p>
              <p className="font-medium text-on-surface">{user.systemRole}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Account Created</p>
              <p className="font-medium text-on-surface">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">User ID</p>
              <p className="font-mono text-xs text-on-surface-variant">{user.id}</p>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
